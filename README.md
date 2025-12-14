# Simulatore Gibus FEM v4.1

Simulatore avanzato basato su metodo FEM (Finite Element Method) per l'analisi strutturale di bracci estensibili per tende da sole.

## 🎯 Funzionalità Principali

- **Import SVG**: Caricamento e analisi di profili e sezioni da file SVG
- **Motore FEM Avanzato**: Calcoli strutturali con plasticità, dinamica e analisi fori
- **Analisi EC9**: Verifica secondo Eurocodice 9 per strutture in alluminio
- **Database Materiali**: Oltre 15 leghe di alluminio con parametri completi
- **Editor Interattivo**: Modifica geometrie e visualizzazione real-time

## 📁 File Principali

- **`import_000.html`** - Sistema di import SVG e analisi sezioni
- **`index.html`** - Simulatore principale per bracci estensibili
- **`fem_engine_v4.js`** - Motore FEM con analisi avanzata fori
- **`tests.html`** - Suite di test automatizzati
- **`examples/`** - File SVG di esempio
- **`ESEMPI_UTILIZZO.md`** - Guida completa con esempi

## 🚀 Quick Start

1. Aprire `import_000.html` nel browser
2. Caricare un file SVG di esempio da `examples/`
3. Selezionare materiale e unità di misura
4. Visualizzare proprietà calcolate e esportare per FEM

## 📚 Documentazione

- [Esempi di Utilizzo](ESEMPI_UTILIZZO.md) - Guide dettagliate con codice
- [Esempi SVG](examples/README.md) - Documentazione file di esempio
- [Test Suite](tests.html) - Test automatizzati per validazione

## 🧪 Testing

```bash
# Validazione rapida
node validate.js

# Test completi (aprire nel browser)
open tests.html
```

## 👤 Autore

**Vanni Zanotto**  
Repository: [github.com/vannizanotto/simulatore-gibus](https://github.com/vannizanotto/simulatore-gibus)

## 📄 Licenza

Questo progetto è fornito per scopi educativi e di ricerca.
