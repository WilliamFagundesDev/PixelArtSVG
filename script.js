document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const gridWidthInput = document.getElementById('grid-width');
    const gridHeightInput = document.getElementById('grid-height');
    const applyGridBtn = document.getElementById('apply-grid');
    const drawGrid = document.getElementById('draw-grid');
    const drawGridContainer = document.getElementById('draw-grid-container');
    const previewContainer = document.getElementById('preview-container');
    const colorPicker = document.getElementById('color-picker');
    const recentColorsList = document.getElementById('recent-colors-list');
    const clearBtn = document.getElementById('clear-btn');
    const copySvgBtn = document.getElementById('copy-svg-btn');
    const importSvgBtn = document.getElementById('import-svg-btn');
    const importModal = document.getElementById('import-modal');
    const svgImportTextarea = document.getElementById('svg-import-textarea');
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    const confirmImportBtn = document.getElementById('confirm-import-btn');
    
    // Novos Elementos para Mesclar e Dividir
    const openMergeBtn = document.getElementById('open-merge-btn');
    const openSplitBtn = document.getElementById('open-split-btn');
    const mergeModal = document.getElementById('merge-modal');
    const splitModal = document.getElementById('split-modal');
    const cancelMergeBtn = document.getElementById('cancel-merge-btn');
    const confirmMergeBtn = document.getElementById('confirm-merge-btn');
    const cancelSplitBtn = document.getElementById('cancel-split-btn');
    const confirmSplitBtn = document.getElementById('confirm-split-btn');
    
    const mergeD1 = document.getElementById('merge-d1');
    const mergeD2 = document.getElementById('merge-d2');
    const mergeDirection = document.getElementById('merge-direction');
    const mergeName = document.getElementById('merge-name');
    
    const splitTarget = document.getElementById('split-target');
    const splitDirection = document.getElementById('split-direction');
    const splitName1 = document.getElementById('split-name1');
    const splitName2 = document.getElementById('split-name2');
    
    // Tools
    const toolBtns = document.querySelectorAll('.tool-btn');
    
    // Palettes
    const paletteSelector = document.getElementById('palette-selector');
    const newPaletteBtn = document.getElementById('new-palette-btn');
    const deletePaletteBtn = document.getElementById('delete-palette-btn');
    const addColorBtn = document.getElementById('add-color-btn');
    const paletteColorsList = document.getElementById('palette-colors-list');

    // Drawings
    const drawingNameInput = document.getElementById('drawing-name');
    const saveDrawingBtn = document.getElementById('save-drawing-btn');
    const savedDrawingsSelector = document.getElementById('saved-drawings-selector');
    const loadDrawingBtn = document.getElementById('load-drawing-btn');
    const deleteDrawingBtn = document.getElementById('delete-drawing-btn');

    // State
    let width = parseInt(gridWidthInput.value);
    let height = parseInt(gridHeightInput.value);
    let currentColor = colorPicker.value;
    let isDrawing = false;
    let currentTool = 'pencil'; // pencil, eraser, eyedropper, replace, select
    let gridData = [];
    let recentColors = []; // Max 10
    
    // State Selection & Dragging
    let isSelecting = false;
    let isDraggingSelection = false;
    let selectionStartX = 0, selectionStartY = 0;
    let selectionEndX = 0, selectionEndY = 0;
    let dragStartX = 0, dragStartY = 0;
    let dragStartSelectionX = 0, dragStartSelectionY = 0;
    let floatingSelection = null; // { x, y, w, h, data: [] }
    let lastHoveredIndex = -1;
    
    // Palettes State
    let palettes = JSON.parse(localStorage.getItem('pixelArtPalettes')) || {
        "Padrão": ['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b']
    };
    let activePalette = Object.keys(palettes)[0];

    // Drawings State
    let savedDrawings = JSON.parse(localStorage.getItem('pixelArtDrawings')) || {};

    // Initialize
    initGrid();
    updateRecentColors();
    initPalettes();
    updateDrawingsSelector();

    // Event Listeners
    applyGridBtn.addEventListener('click', () => {
        width = parseInt(gridWidthInput.value);
        height = parseInt(gridHeightInput.value);
        initGrid();
    });

    colorPicker.addEventListener('input', (e) => {
        setCurrentColor(e.target.value);
    });

    clearBtn.addEventListener('click', initGrid);
    copySvgBtn.addEventListener('click', copySVG);

    importSvgBtn.addEventListener('click', () => {
        svgImportTextarea.value = '';
        importModal.style.display = 'flex';
    });

    cancelImportBtn.addEventListener('click', () => {
        importModal.style.display = 'none';
    });

    confirmImportBtn.addEventListener('click', () => {
        const svgCode = svgImportTextarea.value.trim();
        if (svgCode) {
            importSVG(svgCode);
        }
        importModal.style.display = 'none';
    });

    // ============================================
    // Lógica Matemática de Mesclagem (Merge)
    // ============================================
    openMergeBtn.addEventListener('click', () => {
        populateDrawingSelects(mergeD1);
        populateDrawingSelects(mergeD2);
        mergeName.value = '';
        mergeModal.style.display = 'flex';
    });

    cancelMergeBtn.addEventListener('click', () => mergeModal.style.display = 'none');

    confirmMergeBtn.addEventListener('click', () => {
        if (!mergeD1.value || !mergeD2.value) return alert('Selecione os dois desenhos.');
        if (!mergeName.value.trim()) return alert('Dê um nome para o novo desenho.');
        
        const d1 = savedDrawings[mergeD1.value];
        const d2 = savedDrawings[mergeD2.value];
        const dir = mergeDirection.value;
        let newWidth, newHeight, newGrid = [];

        if (dir === 'horizontal') {
            newWidth = d1.width + d2.width;
            newHeight = Math.max(d1.height, d2.height);
            newGrid = new Array(newWidth * newHeight).fill(null);
            
            // Pinta Desenho 1 na Esquerda
            for (let y = 0; y < d1.height; y++) {
                for (let x = 0; x < d1.width; x++) {
                    newGrid[y * newWidth + x] = d1.gridData[y * d1.width + x];
                }
            }
            // Pinta Desenho 2 na Direita, deslocando X
            for (let y = 0; y < d2.height; y++) {
                for (let x = 0; x < d2.width; x++) {
                    newGrid[y * newWidth + (x + d1.width)] = d2.gridData[y * d2.width + x];
                }
            }
        } else { // vertical
            newWidth = Math.max(d1.width, d2.width);
            newHeight = d1.height + d2.height;
            newGrid = new Array(newWidth * newHeight).fill(null);
            
            // Pinta Desenho 1 no Topo
            for (let y = 0; y < d1.height; y++) {
                for (let x = 0; x < d1.width; x++) {
                    newGrid[y * newWidth + x] = d1.gridData[y * d1.width + x];
                }
            }
            // Pinta Desenho 2 Em Baixo, deslocando Y
            for (let y = 0; y < d2.height; y++) {
                for (let x = 0; x < d2.width; x++) {
                    newGrid[(y + d1.height) * newWidth + x] = d2.gridData[y * d2.width + x];
                }
            }
        }

        savedDrawings[mergeName.value.trim()] = { width: newWidth, height: newHeight, gridData: newGrid };
        localStorage.setItem('pixelArtDrawings', JSON.stringify(savedDrawings));
        updateDrawingsSelector();
        mergeModal.style.display = 'none';
        alert('Desenhos mesclados com sucesso! Selecione-o na lista para carregar.');
    });

    // ============================================
    // Lógica Matemática de Divisão (Split)
    // ============================================
    openSplitBtn.addEventListener('click', () => {
        populateDrawingSelects(splitTarget);
        splitName1.value = '';
        splitName2.value = '';
        splitModal.style.display = 'flex';
    });

    cancelSplitBtn.addEventListener('click', () => splitModal.style.display = 'none');

    confirmSplitBtn.addEventListener('click', () => {
        if (!splitTarget.value) return alert('Selecione um desenho.');
        if (!splitName1.value.trim() || !splitName2.value.trim()) return alert('Dê nome para as duas partes.');
        
        const d = savedDrawings[splitTarget.value];
        const dir = splitDirection.value;
        let w1, h1, w2, h2, grid1, grid2;

        if (dir === 'vertical-cut') {
            w1 = Math.floor(d.width / 2);
            w2 = d.width - w1;
            h1 = h2 = d.height;
            grid1 = new Array(w1 * h1).fill(null);
            grid2 = new Array(w2 * h2).fill(null);

            for (let y = 0; y < d.height; y++) {
                for (let x = 0; x < d.width; x++) {
                    if (x < w1) grid1[y * w1 + x] = d.gridData[y * d.width + x];
                    else grid2[y * w2 + (x - w1)] = d.gridData[y * d.width + x];
                }
            }
        } else { // horizontal-cut
            w1 = w2 = d.width;
            h1 = Math.floor(d.height / 2);
            h2 = d.height - h1;
            grid1 = new Array(w1 * h1).fill(null);
            grid2 = new Array(w2 * h2).fill(null);

            for (let y = 0; y < d.height; y++) {
                for (let x = 0; x < d.width; x++) {
                    if (y < h1) grid1[y * w1 + x] = d.gridData[y * d.width + x];
                    else grid2[(y - h1) * w2 + x] = d.gridData[y * d.width + x];
                }
            }
        }

        savedDrawings[splitName1.value.trim()] = { width: w1, height: h1, gridData: grid1 };
        savedDrawings[splitName2.value.trim()] = { width: w2, height: h2, gridData: grid2 };
        localStorage.setItem('pixelArtDrawings', JSON.stringify(savedDrawings));
        updateDrawingsSelector();
        splitModal.style.display = 'none';
        alert('Desenho dividido com sucesso! As partes estão salvas na sua lista.');
    });

    // Função auxiliar para preencher as seleções de desenhos salvos nos modais
    function populateDrawingSelects(selectElement) {
        selectElement.innerHTML = '';
        Object.keys(savedDrawings).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            selectElement.appendChild(option);
        });
    }

    // Tools setup
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentTool === 'select' && btn.dataset.tool !== 'select') {
                commitSelection();
            }
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            drawGrid.className = `tool-${currentTool}`;
        });
    });

    // --- MOUSE & TOUCH EVENT HANDLERS ---
    function getTargetCell(clientX, clientY) {
        const target = document.elementFromPoint(clientX, clientY);
        return (target && target.classList.contains('pixel-cell')) ? target : null;
    }

    function handlePointerDown(target) {
        const index = parseInt(target.dataset.index);
        const x = index % width;
        const y = Math.floor(index / width);
        lastHoveredIndex = index;

        if (currentTool === 'select') {
            if (floatingSelection && 
                x >= floatingSelection.x && x < floatingSelection.x + floatingSelection.w && 
                y >= floatingSelection.y && y < floatingSelection.y + floatingSelection.h) {
                
                // Iniciando o arrasto da seleção atual
                isDraggingSelection = true;
                dragStartX = x;
                dragStartY = y;
                dragStartSelectionX = floatingSelection.x;
                dragStartSelectionY = floatingSelection.y;
            } else {
                // Clicou fora: aplica a seleção anterior e começa uma nova
                commitSelection();
                isSelecting = true;
                selectionStartX = x;
                selectionStartY = y;
                selectionEndX = x;
                selectionEndY = y;
                renderGrid(); 
            }
        } else {
            commitSelection();
            isDrawing = true;
            useTool(target);
        }
    }

    function handlePointerMove(target) {
        const index = parseInt(target.dataset.index);
        if (index === lastHoveredIndex) return; // Evitar re-renders desnecessários na mesma célula
        lastHoveredIndex = index;

        const x = index % width;
        const y = Math.floor(index / width);

        if (currentTool === 'select') {
            if (isSelecting) {
                selectionEndX = x;
                selectionEndY = y;
                renderGrid();
            } else if (isDraggingSelection && floatingSelection) {
                const dx = x - dragStartX;
                const dy = y - dragStartY;
                floatingSelection.x = dragStartSelectionX + dx;
                floatingSelection.y = dragStartSelectionY + dy;
                renderGrid();
            }
        } else if (isDrawing) {
            if (currentTool === 'pencil' || currentTool === 'eraser') {
                useTool(target);
            }
        }
    }

    function handlePointerUp() {
        if (currentTool === 'select') {
            if (isSelecting) {
                isSelecting = false;
                createFloatingSelection();
            } else if (isDraggingSelection) {
                isDraggingSelection = false;
            }
        } else if (isDrawing) {
            isDrawing = false;
            if (currentTool === 'pencil') addRecentColor(currentColor);
        }
        lastHoveredIndex = -1;
    }

    // Mouse Events
    drawGrid.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Apenas botão esquerdo
        e.preventDefault();
        if (e.target.classList.contains('pixel-cell')) handlePointerDown(e.target);
    });

    drawGrid.addEventListener('mousemove', (e) => {
        if (!isDrawing && !isSelecting && !isDraggingSelection) return;
        if (e.target.classList.contains('pixel-cell')) handlePointerMove(e.target);
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) handlePointerUp();
    });

    // Touch Events
    drawGrid.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const cell = getTargetCell(e.touches[0].clientX, e.touches[0].clientY);
        if (cell) handlePointerDown(cell);
    }, {passive: false});

    drawGrid.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing && !isSelecting && !isDraggingSelection) return;
        const cell = getTargetCell(e.touches[0].clientX, e.touches[0].clientY);
        if (cell) handlePointerMove(cell);
    }, {passive: false});

    document.addEventListener('touchend', handlePointerUp);

    // Palette Event Listeners
    paletteSelector.addEventListener('change', (e) => {
        activePalette = e.target.value;
        renderPaletteColors();
    });

    newPaletteBtn.addEventListener('click', () => {
        const name = prompt("Nome da nova paleta:");
        if (name && !palettes[name]) {
            palettes[name] = [];
            activePalette = name;
            savePalettes();
            updatePaletteSelector();
            renderPaletteColors();
        } else if (palettes[name]) {
            alert("Uma paleta com esse nome já existe.");
        }
    });

    deletePaletteBtn.addEventListener('click', () => {
        if (Object.keys(palettes).length <= 1) {
            alert("Você precisa ter pelo menos uma paleta.");
            return;
        }
        if (confirm(`Tem certeza que deseja deletar a paleta "${activePalette}"?`)) {
            delete palettes[activePalette];
            activePalette = Object.keys(palettes)[0];
            savePalettes();
            updatePaletteSelector();
            renderPaletteColors();
        }
    });

    addColorBtn.addEventListener('click', () => {
        if (!palettes[activePalette].includes(currentColor)) {
            palettes[activePalette].push(currentColor);
            savePalettes();
            renderPaletteColors();
        }
    });

    // Drawings Event Listeners
    saveDrawingBtn.addEventListener('click', () => {
        const name = drawingNameInput.value.trim();
        if (!name) {
            alert('Por favor, dê um nome ao desenho antes de salvar.');
            return;
        }
        
        // Se estiver com algo selecionado, aplica a seleção antes de salvar
        if (floatingSelection) commitSelection();

        savedDrawings[name] = {
            width: width,
            height: height,
            gridData: [...gridData]
        };
        
        localStorage.setItem('pixelArtDrawings', JSON.stringify(savedDrawings));
        updateDrawingsSelector();
        savedDrawingsSelector.value = name;
        alert(`Desenho "${name}" salvo com sucesso!`);
    });

    loadDrawingBtn.addEventListener('click', () => {
        const name = savedDrawingsSelector.value;
        if (!name || !savedDrawings[name]) {
            alert('Por favor, selecione um desenho para carregar.');
            return;
        }
        
        const drawing = savedDrawings[name];
        
        // Confirm se houver algo desenhado
        const hasDrawing = gridData.some(c => c !== null && c !== 'transparent');
        if (hasDrawing && !confirm('Carregar este desenho vai substituir o seu atual. Deseja continuar?')) {
            return;
        }

        width = drawing.width;
        height = drawing.height;
        gridWidthInput.value = width;
        gridHeightInput.value = height;
        drawingNameInput.value = name;
        
        initGrid();
        
        // Apply saved data
        gridData = [...drawing.gridData];
        for (let i = 0; i < gridData.length; i++) {
            const color = gridData[i];
            if (color && color !== 'transparent') {
                drawGrid.children[i].style.backgroundColor = color;
            }
        }
        
        updatePreview();
    });

    deleteDrawingBtn.addEventListener('click', () => {
        const name = savedDrawingsSelector.value;
        if (!name || !savedDrawings[name]) {
            return;
        }
        
        if (confirm(`Tem certeza que deseja deletar o desenho "${name}" permanentemente?`)) {
            delete savedDrawings[name];
            localStorage.setItem('pixelArtDrawings', JSON.stringify(savedDrawings));
            updateDrawingsSelector();
        }
    });

    // --- SELECTION & RENDERING CORE ---
    
    function createFloatingSelection() {
        const minX = Math.min(selectionStartX, selectionEndX);
        const maxX = Math.max(selectionStartX, selectionEndX);
        const minY = Math.min(selectionStartY, selectionEndY);
        const maxY = Math.max(selectionStartY, selectionEndY);

        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        const data = [];

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const idx = y * width + x;
                data.push(gridData[idx]);
                gridData[idx] = null; // Limpa a posição base para o pixel mover visualmente
            }
        }

        floatingSelection = { x: minX, y: minY, w, h, data };
        renderGrid();
    }

    function commitSelection() {
        if (!floatingSelection) return;
        
        for (let y = 0; y < floatingSelection.h; y++) {
            for (let x = 0; x < floatingSelection.w; x++) {
                const fColor = floatingSelection.data[y * floatingSelection.w + x];
                // Coloca de volta os pixels se eles existirem (não sobrepõe com transparente)
                if (fColor) {
                    const targetX = floatingSelection.x + x;
                    const targetY = floatingSelection.y + y;
                    
                    if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
                        gridData[targetY * width + targetX] = fColor;
                    }
                }
            }
        }
        floatingSelection = null;
        renderGrid();
    }

    // renderGrid repinta todo o grid unindo a camada base (gridData) e a seleção flutuante.
    function renderGrid() {
        let sMinX = -1, sMaxX = -1, sMinY = -1, sMaxY = -1;
        if (isSelecting) {
            sMinX = Math.min(selectionStartX, selectionEndX);
            sMaxX = Math.max(selectionStartX, selectionEndX);
            sMinY = Math.min(selectionStartY, selectionEndY);
            sMaxY = Math.max(selectionStartY, selectionEndY);
        } else if (floatingSelection) {
            sMinX = floatingSelection.x;
            sMaxX = floatingSelection.x + floatingSelection.w - 1;
            sMinY = floatingSelection.y;
            sMaxY = floatingSelection.y + floatingSelection.h - 1;
        }

        const cells = drawGrid.children;
        for (let i = 0; i < width * height; i++) {
            const x = i % width;
            const y = Math.floor(i / width);
            const cell = cells[i];

            let color = gridData[i];
            
            // Sobrescreve com o pixel flutuante sendo movido (se aplicável)
            if (floatingSelection && x >= sMinX && x <= sMaxX && y >= sMinY && y <= sMaxY) {
                const localX = x - floatingSelection.x;
                const localY = y - floatingSelection.y;
                const fColor = floatingSelection.data[localY * floatingSelection.w + localX];
                if (fColor) color = fColor;
            }

            cell.style.backgroundColor = color || 'transparent';

            // Tratamento visual das bordas da seleção (usando as classes com pseudo-elementos no CSS)
            cell.classList.remove('selection-area', 'selection-top', 'selection-bottom', 'selection-left', 'selection-right');

            if ((isSelecting || floatingSelection) && x >= sMinX && x <= sMaxX && y >= sMinY && y <= sMaxY) {
                cell.classList.add('selection-area');
                if (y === sMinY) cell.classList.add('selection-top');
                if (y === sMaxY) cell.classList.add('selection-bottom');
                if (x === sMinX) cell.classList.add('selection-left');
                if (x === sMaxX) cell.classList.add('selection-right');
            }
        }
        updatePreview();
    }

    // Core Functions
    function useTool(cell) {
        const index = parseInt(cell.dataset.index);
        
        if (currentTool === 'pencil') {
            cell.style.backgroundColor = currentColor;
            gridData[index] = currentColor;
            updatePreview();
        } 
        else if (currentTool === 'eraser') {
            cell.style.backgroundColor = 'transparent';
            gridData[index] = null;
            updatePreview();
        }
        else if (currentTool === 'eyedropper') {
            const color = gridData[index];
            if (color) {
                setCurrentColor(color);
                // Return to pencil automatically
                document.querySelector('[data-tool="pencil"]').click();
            }
        }
        else if (currentTool === 'replace') {
            const targetColor = gridData[index];
            if (targetColor === currentColor) return; // Nothing to do
            
            // Se clicar no transparente, substitui todos os transparentes
            for (let i = 0; i < gridData.length; i++) {
                if (gridData[i] === targetColor) {
                    gridData[i] = currentColor;
                }
            }
            renderGrid(); // Como muda multiplos blocos, usamos a repintura total
            addRecentColor(currentColor);
        }
    }

    function initGrid() {
        drawGrid.innerHTML = '';
        drawGrid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        drawGrid.style.gridTemplateRows = `repeat(${height}, 1fr)`;
        
        resizeGrid();

        gridData = new Array(width * height).fill(null);
        floatingSelection = null;
        isSelecting = false;
        
        const midX = Math.ceil(width / 2) - 1;
        const midY = Math.ceil(height / 2) - 1;

        for (let i = 0; i < width * height; i++) {
            const cell = document.createElement('div');
            cell.classList.add('pixel-cell');
            
            const x = i % width;
            const y = Math.floor(i / width);
            
            if (x === midX) cell.classList.add('center-col');
            if (y === midY) cell.classList.add('center-row');
            
            cell.dataset.index = i;
            cell.style.backgroundColor = 'transparent';
            drawGrid.appendChild(cell);
        }

        updatePreview();
    }
    
    function resizeGrid() {
        // Obter tamanho do container
        const containerWidth = drawGridContainer.clientWidth - 32; // 32px de padding/margem
        const containerHeight = drawGridContainer.clientHeight - 32;
        
        // Calcular o tamanho do quadrado disponível
        const maxSize = Math.min(containerWidth, containerHeight);
        
        // Calcular o tamanho ideal da célula
        // Ex: Se container é 500x500, grid 32x32, cell size = 500/32 = 15.625px
        let cellSize = maxSize / Math.max(width, height);
        
        // Limitar tamanho mínimo para que não fique impossível de clicar (com scroll se precisar)
        if (cellSize < 8) cellSize = 8;
        
        drawGrid.style.width = `${cellSize * width}px`;
        drawGrid.style.height = `${cellSize * height}px`;
    }

    function generateSVG() {
        let svgElements = '';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                let color = gridData[index];
                
                // Incorpora os blocos flutuantes da seleção no SVG
                if (floatingSelection && x >= floatingSelection.x && x < floatingSelection.x + floatingSelection.w && y >= floatingSelection.y && y < floatingSelection.y + floatingSelection.h) {
                    const localX = x - floatingSelection.x;
                    const localY = y - floatingSelection.y;
                    const fColor = floatingSelection.data[localY * floatingSelection.w + localX];
                    if (fColor) color = fColor;
                }

                if (color && color !== 'transparent') {
                    svgElements += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />\n  `;
                }
            }
        }
        
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
  ${svgElements.trim()}
</svg>`;
    }

    function updatePreview() {
        previewContainer.innerHTML = generateSVG();
    }

    function setCurrentColor(color) {
        currentColor = color;
        colorPicker.value = color;
    }

    function addRecentColor(color) {
        if (!recentColors.includes(color)) {
            recentColors.unshift(color);
            if (recentColors.length > 10) {
                recentColors.pop();
            }
            updateRecentColors();
        } else {
             recentColors = recentColors.filter(c => c !== color);
             recentColors.unshift(color);
             updateRecentColors();
        }
    }

    function updateRecentColors() {
        recentColorsList.innerHTML = '';
        if (recentColors.length === 0) {
            recentColorsList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">Nenhuma cor ainda</span>';
            return;
        }

        recentColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            swatch.style.backgroundColor = color;
            swatch.title = color;
            swatch.addEventListener('click', () => {
                setCurrentColor(color);
            });
            recentColorsList.appendChild(swatch);
        });
    }

    function copySVG() {
        const svgContent = generateSVG();
        navigator.clipboard.writeText(svgContent).then(() => {
            const originalText = copySvgBtn.innerText;
            copySvgBtn.innerText = 'Copiado!';
            setTimeout(() => {
                copySvgBtn.innerText = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar SVG: ', err);
            alert('Falha ao copiar.');
        });
    }

    function importSVG(svgCode) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgCode, "image/svg+xml");
            const svgElement = doc.querySelector('svg');
            
            if (!svgElement) {
                alert('Código SVG inválido. Certifique-se de que contém a tag <svg>.');
                return;
            }
            
            let newWidth = 32;
            let newHeight = 32;
            
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(/[ ,]+/).map(Number);
                if (parts.length >= 4) {
                    newWidth = parts[2];
                    newHeight = parts[3];
                }
            } else if (svgElement.getAttribute('width') && svgElement.getAttribute('height')) {
                newWidth = parseInt(svgElement.getAttribute('width'));
                newHeight = parseInt(svgElement.getAttribute('height'));
            }
            
            if (newWidth > 64 || newHeight > 64) {
                if (!confirm(`O SVG tem dimensões grandes (${newWidth}x${newHeight}). O máximo suportado é 64x64. O SVG será redimensionado ou cortado. Deseja continuar?`)) {
                    return;
                }
            }
            
            width = Math.min(newWidth, 64);
            height = Math.min(newHeight, 64);
            gridWidthInput.value = width;
            gridHeightInput.value = height;
            
            initGrid();
            
            const rects = svgElement.querySelectorAll('rect');
            rects.forEach(rect => {
                const x = parseFloat(rect.getAttribute('x'));
                const y = parseFloat(rect.getAttribute('y'));
                let fill = rect.getAttribute('fill');
                
                if (!isNaN(x) && !isNaN(y) && fill && x >= 0 && x < width && y >= 0 && y < height) {
                    const index = Math.floor(y) * width + Math.floor(x);
                    gridData[index] = fill;
                }
            });
            
            renderGrid();
        } catch (e) {
            console.error(e);
            alert('Erro ao importar SVG. Verifique o console para mais detalhes.');
        }
    }

    // Palettes Functions
    function initPalettes() {
        updatePaletteSelector();
        renderPaletteColors();
    }

    function updatePaletteSelector() {
        paletteSelector.innerHTML = '';
        Object.keys(palettes).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            if (name === activePalette) option.selected = true;
            paletteSelector.appendChild(option);
        });
    }

    function renderPaletteColors() {
        paletteColorsList.innerHTML = '';
        const colors = palettes[activePalette];
        
        if (!colors || colors.length === 0) {
            paletteColorsList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">Paleta vazia</span>';
            return;
        }

        colors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            swatch.style.backgroundColor = color;
            swatch.title = color;
            
            // Left click to select color
            swatch.addEventListener('click', () => {
                setCurrentColor(color);
            });
            
            // Context menu (right click) to delete from palette
            swatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (confirm('Remover esta cor da paleta?')) {
                    palettes[activePalette].splice(index, 1);
                    savePalettes();
                    renderPaletteColors();
                }
            });
            
            paletteColorsList.appendChild(swatch);
        });
    }

    function savePalettes() {
        localStorage.setItem('pixelArtPalettes', JSON.stringify(palettes));
    }

    // Drawings Functions
    function updateDrawingsSelector() {
        savedDrawingsSelector.innerHTML = '<option value="">-- Salvos --</option>';
        Object.keys(savedDrawings).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            savedDrawingsSelector.appendChild(option);
        });
    }

    // Window resize handler to maintain grid proportions
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
            resizeGrid();
        }, 100);
    });
});