

const express = require('express');
const { Pool } = require('pg'); 
const app = express();

const port = process.env.PORT || 3000;

// --- DATENBANK KONFIGURATION ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- NEU: AUTOMATISCHE TABELLEN-ERSTELLUNG ---
async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitor_stats (
                page_name TEXT PRIMARY KEY,
                counter INTEGER DEFAULT 0
            );
        `);
        console.log("✅ Datenbank-Tabelle ist bereit (vorhanden oder neu erstellt).");
    } catch (err) {
        console.error("❌ Fehler beim Initialisieren der Tabelle:", err);
    }
}

// Datenbank beim Starten der App vorbereiten
initDb();

// --- ROUTEN ---

app.use(express.static('public'));

app.get('/api/visitor-count', async (req, res) => {
    try {
        // UPSERT Logik (Insert oder Update)
        const sql = `
            INSERT INTO visitor_stats (page_name, counter)
            VALUES ('cv_noah', 1)
            ON CONFLICT (page_name)
            DO UPDATE SET counter = visitor_stats.counter + 1
            RETURNING counter;
        `;

        const result = await pool.query(sql);
        
        if (result && result.rows && result.rows.length > 0) {
            res.json({ counter: result.rows[0].counter });
        } else {
            throw new Error("Keine Daten zurückgegeben");
        }
    } catch (err) {
        console.error("Datenbankfehler:", err);
        res.status(500).json({ error: "Fehler beim Zählen", details: err.message });
    }
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});