# Processore CSV con Costo Paolo

## 📋 Descrizione

Questo è un file PHP standalone che legge un file CSV, estrae il codice articolo dalla seconda colonna, effettua richieste HTTP GET a un servizio esterno per recuperare il "costo Paolo" per ogni articolo, e visualizza tutti i dati in un formato tabellare elegante.

## ✨ Funzionalità

1. **Caricamento CSV**: Supporta upload di file CSV tramite interfaccia web
2. **Parsing Automatico**: Legge e parsa automaticamente il file CSV
3. **Richieste HTTP**: Per ogni riga, effettua una chiamata GET a:
   ```
   http://gtech.gibus.it/gibustech/configuratorCOSTIFICAZIONE/interroga.php?cod_articolo=<CODICE>
   ```
4. **Colonna Aggiuntiva**: Aggiunge una nuova colonna "costo Paolo" con i valori recuperati
5. **Visualizzazione Tabellare**: Mostra tutti i dati in una tabella HTML responsive e stilizzata
6. **Gestione Errori**: Gestisce timeout, errori di rete e file non validi

## 🚀 Utilizzo

### Metodo 1: Upload File CSV

1. Aprire `process_csv.php` nel browser web
2. Cliccare su "Seleziona File CSV"
3. Scegliere il file CSV da processare
4. Il file verrà automaticamente caricato e processato

### Metodo 2: File di Esempio

1. Aprire `process_csv.php` nel browser web
2. Cliccare su "Usa File di Esempio"
3. Verrà utilizzato il file `sample_data.csv` incluso

### Metodo 3: URL Diretto

```
http://your-server.com/process_csv.php?use_sample=1
```

## 📝 Formato CSV Richiesto

Il file CSV deve avere il codice articolo nella **seconda colonna** (indice 1):

```csv
Descrizione,Codice Articolo,Prezzo,Quantità
Tenda da sole modello A,ART001,150.00,5
Braccio estensibile tipo B,ART002,200.00,3
```

### Struttura
- **Prima riga**: Header (intestazioni colonne)
- **Seconda colonna**: Codice articolo (usato per la richiesta HTTP)
- **Altre colonne**: Dati aggiuntivi (preservati nella visualizzazione)

## ⚙️ Configurazione

Le seguenti costanti possono essere modificate all'inizio del file `process_csv.php`:

```php
define('BASE_URL', 'http://gtech.gibus.it/gibustech/configuratorCOSTIFICAZIONE/interroga.php');
define('MAX_EXECUTION_TIME', 300);  // Tempo massimo esecuzione (secondi)
define('REQUEST_TIMEOUT', 10);      // Timeout per singola richiesta HTTP (secondi)
```

## 🔧 Requisiti Tecnici

- **PHP**: 7.0 o superiore
- **Estensioni PHP**: 
  - `curl` o `file_get_contents` con supporto URL
  - `fopen` per lettura file
- **Permessi**: Lettura file CSV e accesso HTTP esterno

## 📂 File Inclusi

- **`process_csv.php`**: File PHP principale con tutta la logica e l'interfaccia
- **`sample_data.csv`**: File CSV di esempio per test
- **`CSV_PROCESSOR_README.md`**: Questa documentazione

## 🎨 Caratteristiche Interfaccia

- ✅ Design responsive e moderno
- ✅ Gradient background accattivante
- ✅ Tabella con alternanza colori per migliore leggibilità
- ✅ Colonna "costo Paolo" evidenziata in verde
- ✅ Messaggi di successo/errore chiari
- ✅ Drag & drop per caricamento file
- ✅ Footer con link al repository GitHub

## 🔍 Funzioni Principali

### `fetchCostoPaolo($url)`
Effettua una richiesta HTTP GET all'URL specificato e restituisce la risposta.

**Parametri:**
- `$url` (string): URL completo da interrogare

**Ritorna:**
- (string|false): Risposta del server o "Errore recupero" in caso di errore

### `parseCSV($filepath)`
Legge e parsa un file CSV.

**Parametri:**
- `$filepath` (string): Percorso del file CSV

**Ritorna:**
- (array|false): Array di righe o false in caso di errore

### `processCsvWithCosts($csvData)`
Processa i dati CSV e aggiunge la colonna "costo Paolo".

**Parametri:**
- `$csvData` (array): Dati CSV parsati

**Ritorna:**
- (array): Array con dati arricchiti della nuova colonna

### `generateTable($data)`
Genera l'HTML per visualizzare i dati in formato tabellare.

**Parametri:**
- `$data` (array): Dati da visualizzare

**Ritorna:**
- (string): HTML della tabella

## 🛡️ Sicurezza

- ✅ Tutti gli output sono sanificati con `htmlspecialchars()`
- ✅ URL encoding per parametri GET
- ✅ Validazione file upload
- ✅ Timeout configurabili per prevenire blocchi
- ✅ User-Agent personalizzato nelle richieste HTTP

## 📊 Esempio Output

Quando il CSV viene processato, viene generata una tabella con:
- Tutte le colonne originali del CSV
- Una nuova colonna "costo Paolo" con i valori recuperati dall'API
- Colori alternati per le righe
- Evidenziazione della colonna "costo Paolo"

## 🐛 Gestione Errori

Il sistema gestisce i seguenti casi:
- File CSV non trovato o non leggibile
- Errori di upload
- Timeout nelle richieste HTTP
- Risposte vuote o non valide dall'API
- Righe CSV senza codice articolo

In caso di errore, viene mostrato "Errore recupero" o "N/A" nella colonna "costo Paolo".

## 💡 Note Importanti

1. **Performance**: Per CSV con molte righe, il tempo di elaborazione può essere lungo a causa delle richieste HTTP sequenziali
2. **Timeout**: Il timeout totale è configurabile tramite `MAX_EXECUTION_TIME`
3. **Cache**: Non è implementata cache. Ogni caricamento riesegue tutte le richieste
4. **Encoding**: Il file supporta CSV con encoding UTF-8

## 📞 Supporto

Per problemi o domande:
- **Repository**: [github.com/vannizanotto/simulatore-gibus](https://github.com/vannizanotto/simulatore-gibus)
- **Autore**: Vanni Zanotto

## 📜 Licenza

Questo progetto è fornito per scopi educativi e di ricerca.

---

**Version**: 1.0  
**Last Updated**: 2026-01-07
