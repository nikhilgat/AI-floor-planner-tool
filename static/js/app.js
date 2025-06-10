// static/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const furnitureList = document.getElementById('furniture-list');
    const canvas = document.getElementById('canvas');
    const deleteBtn = document.getElementById('delete-btn');
    let roomContainer; // Will be initialized later

    // --- STATE MANAGEMENT ---
    let selectedObject = null;
    let objectCounter = 0;

    // --- FURNITURE CATALOG ---
    const furnitureCatalog = [
        { name: 'Sofa', image: '/static/images/sofa.svg', width: 200, height: 90 },
        { name: 'Table', image: '/static/images/table.svg', width: 120, height: 70 },
        { name: 'Chair', image: '/static/images/chair.svg', width: 50, height: 50 },
        { name: 'Rug', image: '/static/images/rug.svg', width: 240, height: 160 },
    ];

    // --- INITIALIZATION ---

    function populateFurnitureList() {
        furnitureCatalog.forEach(item => {
            // New styled sidebar item
            const div = document.createElement('div');
            div.className = 'bg-gray-100 p-2 rounded-lg hover:bg-blue-100 cursor-grab flex flex-col items-center space-y-2';
            div.draggable = true;
            div.dataset.name = item.name;
            div.dataset.image = item.image;
            div.dataset.width = item.width;
            div.dataset.height = item.height;

            const img = document.createElement('img');
            img.src = item.image;
            img.className = 'w-24 h-24 object-contain';
            img.draggable = false;

            const span = document.createElement('span');
            span.textContent = item.name;
            span.className = 'font-semibold text-sm';

            div.appendChild(img);
            div.appendChild(span);
            furnitureList.appendChild(div);

            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(item));
            });
        });
    }
    
    // --- ROOM CREATION AND ADJUSTMENT ---
    
    function initializeRoom() {
        roomContainer = document.createElement('div');
        roomContainer.id = 'room-container';
        roomContainer.style.width = '600px';
        roomContainer.style.height = '400px';

        // Add handles for resizing the room
        ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `handle room-handle ${pos}`;
            roomContainer.appendChild(handle);
            addRoomResizeListener(handle, pos);
        });

        // Add dimension display for the room
        const dimDisplay = document.createElement('div');
        dimDisplay.className = 'dimension-display';
        roomContainer.appendChild(dimDisplay);
        
        canvas.appendChild(roomContainer);
        updateRoomDimensions(); // Set initial dimensions
    }
    
    function updateRoomDimensions() {
        const display = roomContainer.querySelector('.dimension-display');
        display.textContent = `${roomContainer.offsetWidth} x ${roomContainer.offsetHeight} cm`;
    }

    function addRoomResizeListener(handle, position) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        handle.addEventListener('mousedown', e => {
            e.stopPropagation();
            isResizing = true;
            roomContainer.classList.add('is-resizing');
            startX = e.clientX;
            startY = e.clientY;
            startWidth = roomContainer.offsetWidth;
            startHeight = roomContainer.offsetHeight;
            document.body.style.cursor = handle.style.cursor;
        });

        document.addEventListener('mousemove', e => {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (position.includes('right')) newWidth += dx;
            if (position.includes('left')) newWidth -= dx;
            if (position.includes('bottom')) newHeight += dy;
            if (position.includes('top')) newHeight -= dy;
            
            // Set a minimum size
            roomContainer.style.width = `${Math.max(100, newWidth)}px`;
            roomContainer.style.height = `${Math.max(100, newHeight)}px`;
            
            updateRoomDimensions();
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            roomContainer.classList.remove('is-resizing');
            document.body.style.cursor = 'default';
        });
    }

    // --- CANVAS INTERACTIONS (Dropping Furniture) ---

    // Allow dropping ONLY on the room container
    function setupDropZone() {
        roomContainer.addEventListener('dragover', e => e.preventDefault());

        roomContainer.addEventListener('drop', e => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const roomRect = roomContainer.getBoundingClientRect();
            
            // Calculate position relative to the room container
            const x = e.clientX - roomRect.left - (data.width / 2);
            const y = e.clientY - roomRect.top - (data.height / 2);
            
            createFurnitureObject(data, x, y);
        });
    }
    
    // --- OBJECT CREATION AND MANIPULATION ---

    function createFurnitureObject(itemData, x, y) {
        objectCounter++;
        const objWrapper = document.createElement('div');
        objWrapper.id = `object-${objectCounter}`;
        objWrapper.className = 'absolute cursor-move';
        objWrapper.style.left = `${x}px`;
        objWrapper.style.top = `${y}px`;
        objWrapper.style.width = `${itemData.width}px`;
        objWrapper.style.height = `${itemData.height}px`;
        objWrapper.style.transform = 'rotate(0deg)';

        const img = document.createElement('img');
        img.src = itemData.image;
        img.className = 'w-full h-full pointer-events-none';

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'handle resize-handle';
        
        const rotateHandle = document.createElement('div');
        rotateHandle.className = 'handle rotate-handle';
        
        const dimDisplay = document.createElement('div');
        dimDisplay.className = 'dimension-display';
        dimDisplay.textContent = `${itemData.width} x ${itemData.height} cm`;

        objWrapper.appendChild(img);
        objWrapper.appendChild(resizeHandle);
        objWrapper.appendChild(rotateHandle);
        objWrapper.appendChild(dimDisplay);
        roomContainer.appendChild(objWrapper);
        
        addEventListenersToFurniture(objWrapper);
        selectObject(objWrapper);
    }

    function addEventListenersToFurniture(obj) {
        let isDragging = false, isResizing = false, isRotating = false;
        let startX, startY, startMouseX, startMouseY, startWidth, startHeight, startAngle;

        const resizeHandle = obj.querySelector('.resize-handle');
        const rotateHandle = obj.querySelector('.rotate-handle');
        const dimDisplay = obj.querySelector('.dimension-display');

        obj.addEventListener('mousedown', e => {
            // Check if the click is on the object itself, not a handle
            if (e.target.classList.contains('cursor-move')) {
                isDragging = true;
                startX = obj.offsetLeft;
                startY = obj.offsetTop;
                startMouseX = e.clientX;
                startMouseY = e.clientY;
                document.body.style.cursor = 'move';
                selectObject(obj);
                e.stopPropagation();
            }
        });

        resizeHandle.addEventListener('mousedown', e => {
            e.stopPropagation();
            isResizing = true;
            obj.classList.add('is-resizing'); // Show dimensions
            startWidth = obj.offsetWidth;
            startHeight = obj.offsetHeight;
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            document.body.style.cursor = 'nwse-resize';
        });

        rotateHandle.addEventListener('mousedown', e => { /* ... rotation logic as before ... */ });

        document.addEventListener('mousemove', e => {
            if (isDragging) {
                obj.style.left = `${startX + e.clientX - startMouseX}px`;
                obj.style.top = `${startY + e.clientY - startMouseY}px`;
            } else if (isResizing) {
                const newWidth = startWidth + (e.clientX - startMouseX);
                const newHeight = startHeight + (e.clientY - startMouseY);
                obj.style.width = `${Math.max(20, newWidth)}px`;
                obj.style.height = `${Math.max(20, newHeight)}px`;
                // Update dimension display LIVE
                dimDisplay.textContent = `${Math.round(newWidth)} x ${Math.round(newHeight)} cm`;
            } else if (isRotating) { /* ... rotation logic as before ... */ }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) obj.classList.remove('is-resizing'); // Hide dimensions
            isDragging = isResizing = isRotating = false;
            document.body.style.cursor = 'default';
        });
    }
    
    // --- SELECTION AND DELETION LOGIC (Mostly Unchanged) ---

    function selectObject(obj) {
        if (selectedObject && selectedObject !== obj) {
            selectedObject.classList.remove('selected');
        }
        selectedObject = obj;
        selectedObject.classList.add('selected');
        deleteBtn.disabled = false;
    }

    function deselectAll() {
        if (selectedObject) {
            selectedObject.classList.remove('selected');
        }
        selectedObject = null;
        deleteBtn.disabled = true;
    }

    // Deselect when clicking on the canvas background (but not the room)
    canvas.addEventListener('click', e => {
        if (e.target.id === 'canvas') deselectAll();
    });

    deleteBtn.addEventListener('click', () => {
        if (selectedObject) {
            selectedObject.remove();
            deselectAll();
        }
    });

    // --- START THE APP ---
    populateFurnitureList();
    initializeRoom();
    setupDropZone();
});