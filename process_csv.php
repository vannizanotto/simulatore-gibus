<?php
/**
 * CSV Processor with HTTP Cost Retrieval
 * 
 * Questa pagina PHP legge un file CSV, estrae il codice articolo dalla seconda colonna,
 * effettua una richiesta HTTP GET per recuperare il "costo Paolo" e visualizza 
 * tutti i dati in formato tabellare.
 * 
 * @author Vanni Zanotto
 * @version 1.0
 */

// Configurazione
define('BASE_URL', 'http://gtech.gibus.it/gibustech/configuratorCOSTIFICAZIONE/interroga.php');
define('MAX_EXECUTION_TIME', 300); // 5 minuti per elaborazioni lunghe
define('REQUEST_TIMEOUT', 10); // Timeout per singola richiesta HTTP

// Aumenta il tempo di esecuzione per elaborazioni lunghe
set_time_limit(MAX_EXECUTION_TIME);

/**
 * Effettua una richiesta HTTP GET all'URL specificato
 * 
 * @param string $url URL completo da interrogare
 * @return string|false Risposta del server o false in caso di errore
 */
function fetchCostoPaolo($url) {
    $context = stream_context_create([
        'http' => [
            'timeout' => REQUEST_TIMEOUT,
            'ignore_errors' => true,
            'header' => "User-Agent: Mozilla/5.0 (compatible; CSV-Processor/1.0)\r\n"
        ]
    ]);
    
    // Effettua la richiesta HTTP senza soppressione errori
    $response = file_get_contents($url, false, $context);
    
    // Gestione esplicita degli errori
    if ($response === false) {
        $error = error_get_last();
        error_log("Errore recupero costo per URL: $url - " . ($error['message'] ?? 'Unknown error'));
        return 'Errore recupero';
    }
    
    return trim($response);
}

/**
 * Legge e parsa il file CSV
 * 
 * @param string $filepath Percorso del file CSV
 * @return array|false Array di righe o false in caso di errore
 */
function parseCSV($filepath) {
    if (!file_exists($filepath)) {
        return false;
    }
    
    $rows = [];
    if (($handle = fopen($filepath, "r")) !== false) {
        // Usa un buffer più grande per gestire campi CSV lunghi
        while (($data = fgetcsv($handle, 10000, ",")) !== false) {
            $rows[] = $data;
        }
        fclose($handle);
    }
    
    return $rows;
}

/**
 * Processa il CSV e aggiunge la colonna "costo Paolo"
 * 
 * @param array $csvData Dati CSV parsati
 * @return array Array con dati arricchiti
 */
function processCsvWithCosts($csvData) {
    if (empty($csvData)) {
        return [];
    }
    
    $result = [];
    
    // Prima riga (header): aggiungi "costo Paolo"
    $header = $csvData[0];
    $header[] = 'costo Paolo';
    $result[] = $header;
    
    // Processa ogni riga (salta header)
    for ($i = 1; $i < count($csvData); $i++) {
        $row = $csvData[$i];
        
        // Verifica che esista la seconda colonna (indice 1)
        if (isset($row[1]) && !empty($row[1])) {
            $codArticolo = $row[1];
            
            // Costruisci URL
            $url = BASE_URL . '?cod_articolo=' . urlencode($codArticolo);
            
            // Effettua richiesta HTTP
            $costoPaolo = fetchCostoPaolo($url);
            
            // Aggiungi il costo alla riga
            $row[] = $costoPaolo;
        } else {
            // Se non c'è codice articolo, aggiungi valore vuoto
            $row[] = 'N/A';
        }
        
        $result[] = $row;
    }
    
    return $result;
}

/**
 * Genera HTML per la tabella dei dati
 * 
 * @param array $data Dati da visualizzare
 * @return string HTML della tabella
 */
function generateTable($data) {
    if (empty($data)) {
        return '<p class="error">Nessun dato da visualizzare.</p>';
    }
    
    $html = '<table>';
    
    // Header
    $html .= '<thead><tr>';
    foreach ($data[0] as $header) {
        $html .= '<th>' . htmlspecialchars($header) . '</th>';
    }
    $html .= '</tr></thead>';
    
    // Body
    $html .= '<tbody>';
    for ($i = 1; $i < count($data); $i++) {
        $html .= '<tr>';
        foreach ($data[$i] as $cell) {
            $html .= '<td>' . htmlspecialchars($cell) . '</td>';
        }
        $html .= '</tr>';
    }
    $html .= '</tbody>';
    
    $html .= '</table>';
    
    return $html;
}

// ============ MAIN LOGIC ============

$processedData = null;
$error = null;
$csvFile = null;

// Gestione upload file
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['csv_file'])) {
    $uploadedFile = $_FILES['csv_file'];
    
    // Validazione file
    if ($uploadedFile['error'] === UPLOAD_ERR_OK) {
        $tmpName = $uploadedFile['tmp_name'];
        $csvFile = $tmpName;
    } else {
        $error = 'Errore durante il caricamento del file.';
    }
}
// Se non c'è upload, usa il file di esempio
elseif (isset($_GET['use_sample']) || !isset($_POST['submit'])) {
    $sampleFile = __DIR__ . '/sample_data.csv';
    if (file_exists($sampleFile)) {
        $csvFile = $sampleFile;
    }
}

// Processa il CSV se disponibile
if ($csvFile && !$error) {
    $csvData = parseCSV($csvFile);
    
    if ($csvData !== false && !empty($csvData)) {
        $processedData = processCsvWithCosts($csvData);
    } else {
        $error = 'Impossibile leggere il file CSV o file vuoto.';
    }
}

?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Processore CSV - Costo Paolo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .upload-section {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .upload-section h2 {
            color: #333;
            margin-bottom: 20px;
        }
        
        .file-input-wrapper {
            position: relative;
            display: inline-block;
            margin: 15px 0;
        }
        
        input[type="file"] {
            display: none;
        }
        
        .file-label {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            transition: background 0.3s;
        }
        
        .file-label:hover {
            background: #5568d3;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 30px;
            margin: 10px 5px;
            border: none;
            border-radius: 5px;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            color: white;
        }
        
        .btn-primary {
            background: #28a745;
        }
        
        .btn-primary:hover {
            background: #218838;
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #f5c6cb;
            margin: 20px 0;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #c3e6cb;
            margin: 20px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        
        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 0.5px;
        }
        
        tbody tr:hover {
            background: #f8f9fa;
        }
        
        tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        tbody tr:nth-child(even):hover {
            background: #e9ecef;
        }
        
        .table-wrapper {
            overflow-x: auto;
            margin-top: 20px;
        }
        
        .info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #bee5eb;
            margin: 20px 0;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
        }
        
        .highlight-column {
            background: #fff3cd !important;
            font-weight: 600;
        }
        
        td:last-child {
            background: #d4edda;
            font-weight: 600;
            color: #155724;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Processore CSV con Costo Paolo</h1>
            <p>Carica un file CSV per aggiungere automaticamente la colonna "costo Paolo"</p>
        </header>
        
        <div class="content">
            <?php if ($error): ?>
                <div class="error">
                    <strong>⚠️ Errore:</strong> <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>
            
            <div class="upload-section">
                <h2>Carica il tuo file CSV</h2>
                <p>Il file deve contenere il codice articolo nella seconda colonna</p>
                
                <form method="POST" enctype="multipart/form-data" id="uploadForm">
                    <div class="file-input-wrapper">
                        <input type="file" name="csv_file" id="csv_file" accept=".csv" required>
                        <label for="csv_file" class="file-label">📁 Seleziona File CSV</label>
                    </div>
                    <div style="margin-top: 15px;">
                        <button type="submit" name="submit" class="btn btn-primary">🚀 Carica e Processa</button>
                    </div>
                </form>
                
                <div style="margin-top: 20px;">
                    <a href="?use_sample=1" class="btn btn-secondary">📋 Usa File di Esempio</a>
                </div>
            </div>
            
            <?php if ($processedData): ?>
                <div class="success">
                    <strong>✅ Successo!</strong> Il CSV è stato processato correttamente. 
                    <?php echo (count($processedData) - 1); ?> righe elaborate.
                </div>
                
                <div class="info">
                    <strong>ℹ️ Nota:</strong> La colonna "costo Paolo" contiene i valori recuperati da:
                    <code><?php echo htmlspecialchars(BASE_URL); ?></code>
                </div>
                
                <div class="table-wrapper">
                    <?php echo generateTable($processedData); ?>
                </div>
            <?php elseif (!$error && $_SERVER['REQUEST_METHOD'] === 'GET'): ?>
                <div class="info">
                    <strong>👋 Benvenuto!</strong> Carica un file CSV o usa il file di esempio per iniziare.
                </div>
            <?php endif; ?>
        </div>
        
        <footer>
            <p><strong>Simulatore Gibus</strong> - Processore CSV v1.0</p>
            <p>Creato da Vanni Zanotto | <a href="https://github.com/vannizanotto/simulatore-gibus" target="_blank">GitHub Repository</a></p>
        </footer>
    </div>
    
    <script>
        // Mostra nome file selezionato
        document.getElementById('csv_file')?.addEventListener('change', function(e) {
            const fileName = e.target.files[0]?.name || 'Nessun file selezionato';
            const label = document.querySelector('.file-label');
            if (label && e.target.files[0]) {
                label.textContent = '📁 ' + fileName;
            }
        });
        
        // Validazione form prima del submit
        document.getElementById('uploadForm')?.addEventListener('submit', function(e) {
            const fileInput = document.getElementById('csv_file');
            if (!fileInput.files || fileInput.files.length === 0) {
                alert('Seleziona un file CSV prima di procedere');
                e.preventDefault();
                return false;
            }
        });
    </script>
</body>
</html>
