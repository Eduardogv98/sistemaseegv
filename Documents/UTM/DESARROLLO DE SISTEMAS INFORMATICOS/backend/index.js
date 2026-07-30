const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Para procesar JSON

// Configuración de la conexión a PostgreSQL
// Asegúrate de poner tu contraseña real de postgres
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'helpdesk_db',
    password: '12345', 
    port: 5432,
});

// GET /tickets: Listar todos los incidentes
app.get('/tickets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Tickets');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /tickets: Registrar un nuevo incidente
app.post('/tickets', async (req, res) => {
    const { titulo, descripcion, categoria, prioridad, estado } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Tickets (titulo, descripcion, categoria, prioridad, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [titulo, descripcion, categoria, prioridad, estado]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /tickets/:id: Buscar un ticket específico
app.get('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Tickets WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /tickets/:id: Actualizar el estado o detalles de un ticket
app.put('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    // COALESCE permite que, si no envías un dato, conserve el que ya tenía en la base de datos
    const { titulo, descripcion, categoria, prioridad, estado } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE Tickets 
             SET titulo = COALESCE($1, titulo), 
                 descripcion = COALESCE($2, descripcion), 
                 categoria = COALESCE($3, categoria), 
                 prioridad = COALESCE($4, prioridad), 
                 estado = COALESCE($5, estado) 
             WHERE id = $6 RETURNING *`,
            [titulo, descripcion, categoria, prioridad, estado, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /tickets/:id: Eliminar un registro
app.delete('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM Tickets WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.status(200).json({ message: 'Ticket eliminado con éxito', ticket: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});