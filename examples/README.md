# Example SVG Files

This directory contains example SVG files for testing the SVG import functionality in the Gibus FEM simulator.

## Files

### Profili (Bracci)

1. **profilo_standard_6x3.svg**
   - Profilo rettangolare cavo standard
   - Dimensioni: 60mm x 30mm
   - Spessore pareti: 3mm
   - Uso: Profilo braccio standard

2. **profilo_aerodinamico.svg**
   - Profilo con forma aerodinamica (Gibus Aero)
   - Dimensioni: ~62mm x 33mm
   - Forma: Bombata/curvata
   - Uso: Profili ad alte prestazioni estetiche

3. **profilo_con_led.svg**
   - Profilo rettangolare con cava LED superiore
   - Dimensioni: 62mm x 33mm
   - Cava LED: 12mm x 8mm
   - Uso: Profili con illuminazione integrata

### Spalle/Calcagni

4. **spalla_piena.svg**
   - Sezione piena rettangolare
   - Dimensioni: 94mm x 44mm
   - Uso: Spalla standard (massima rigidezza)

5. **spalla_a_i.svg**
   - Sezione a doppia T (I-Beam)
   - Dimensioni: 94mm x 44mm
   - Ali: 8mm (superiore e inferiore)
   - Anima: 6mm
   - Uso: Spalla alleggerita ma resistente

## Come Usare

### In import_000.html

1. Aprire `import_000.html` nel browser
2. Cliccare su "Carica File SVG A" (per profilo) o "Carica File SVG B" (per spalla)
3. Selezionare uno dei file SVG di esempio
4. Impostare:
   - Unità: `mm`
   - Scala: `1.0`
   - Materiale: scegliere dalla lista (es. `6061-T6` per profili, `46100-F` per spalle)
5. Cliccare "Carica"
6. Visualizzare le proprietà calcolate nel pannello risultati

### In index.html

I file SVG possono essere usati anche nel simulatore principale, ma richiedono conversione manuale dei dati geometrici.

## Formato SVG

I file SVG devono rispettare i seguenti requisiti:

- ✅ Formato XML valido
- ✅ Elementi supportati: `path`, `rect`, `circle`, `ellipse`, `polygon`, `polyline`
- ✅ Trasformazioni: vengono applicate automaticamente
- ✅ Unità: definire nell'interfaccia (mm, cm, m, in)
- ✅ Contorni multipli: supportati (contorno esterno + fori interni)

## Validazione

Per ogni file SVG importato, il sistema calcola automaticamente:

- Area sezione (m²)
- Momenti di inerzia Ixx, Iyy (m⁴)
- Baricentro (coordinate X, Y)
- Massa lineare (kg/m) - basata su materiale selezionato
- Spessore minimo parete (se applicabile)

## Note Tecniche

### Orientamento
- Asse X: orizzontale (larghezza)
- Asse Y: verticale (altezza)
- Origine: angolo superiore sinistro del viewBox SVG

### Precisione
- Il sistema campiona ogni path con 400 punti per conversione polilinea
- Le trasformazioni (rotate, scale, translate) vengono applicate via CTM (Current Transformation Matrix)
- L'algoritmo di riconoscimento distingue automaticamente:
  - Contorno esterno (area maggiore)
  - Fori interni (aree minori)

### Ottimizzazione
- Usare il pulsante "Semplifica" per ridurre il numero di vertici mantenendo la forma
- Parametri di semplificazione:
  - Distanza minima tra punti: 2.0 unità
  - Angolo massimo per eliminazione: 0.06 radianti (~3.4°)

## Troubleshooting

### Il file non si carica
- Verificare che il file XML sia ben formato
- Controllare che non ci siano tag `<parsererror>`
- Assicurarsi che ci siano elementi geometrici (`path`, `rect`, ecc.)

### Proprietà calcolate sembrano errate
- Verificare l'unità di misura selezionata
- Controllare che il fattore di scala sia corretto (default: 1.0)
- Per profili molto piccoli o molto grandi, regolare la scala di conseguenza

### Spessore minimo non viene calcolato
- Lo spessore minimo richiede almeno 2 contorni (esterno + interno)
- Verificare che ci siano fori/cavità nella sezione

## Licenza

Questi file di esempio sono forniti per scopi di testing e documentazione.
Sono parte del progetto [simulatore-gibus](https://github.com/vannizanotto/simulatore-gibus).

---

**Autore:** Vanni Zanotto  
**Versione:** 1.0  
**Data:** Dicembre 2025
