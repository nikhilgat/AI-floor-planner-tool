// static/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const furnitureList = document.getElementById('furniture-list');
    const canvas = document.getElementById('canvas');
    const deleteBtn = document.getElementById('delete-btn');
    const saveBtn = document.getElementById('save-btn');
    const toggleDimsSwitch = document.getElementById('toggle-dims-switch');
    let roomContainer;

    // --- STATE MANAGEMENT ---
    let selectedObject = null;
    let objectCounter = 0;
    let showDimensions = true;

    // --- FURNITURE CATALOG ---
    const furnitureCatalog = [
        { name: 'Sofa', image: '/static/images/sofa.svg', width: 200, height: 90 },
        { name: 'Table', image: '/static/images/table.svg', width: 120, height: 70 },
        { name: 'Chair', image: '/static/images/chair.svg', width: 50, height: 50 },
        { name: 'Bed', image: '/static/images/bed.svg', width: 240, height: 160 },
        { name: 'Wardrobe', image: '/static/images/wardrobe.svg', width: 240, height: 160 },
        { name: 'Bedside Table', image: '/static/images/bedside_table.svg', width: 240, height: 160 },
    ];

    // --- INITIALIZATION ---

    // **FIXED:** Restored the full function to show icons
    function populateFurnitureList() {
        furnitureCatalog.forEach(item => {
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

        ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `handle room-handle ${pos}`;
            roomContainer.appendChild(handle);
            addRoomResizeListener(handle, pos);
        });

        const dimDisplay = document.createElement('div');
        dimDisplay.className = 'dimension-display room-dimension';
        roomContainer.appendChild(dimDisplay);
        
        canvas.appendChild(roomContainer);
        updateRoomDimensions();
    }
    
    function updateRoomDimensions() {
        const display = roomContainer.querySelector('.room-dimension');
        if (display) {
            display.textContent = `${roomContainer.offsetWidth} x ${roomContainer.offsetHeight} cm`;
        }
    }
    
    // **FIXED:** Restored the full function to make the room resizable
    function addRoomResizeListener(handle, position) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        handle.addEventListener('mousedown', e => {
            e.stopPropagation();
            isResizing = true;
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
            
            roomContainer.style.width = `${Math.max(100, newWidth)}px`;
            roomContainer.style.height = `${Math.max(100, newHeight)}px`;
            
            updateRoomDimensions();
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = 'default';
        });
    }

    // --- CANVAS INTERACTIONS (Dropping Furniture) ---
    function setupDropZone() {
        roomContainer.addEventListener('dragover', e => e.preventDefault());
        roomContainer.addEventListener('drop', e => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const roomRect = roomContainer.getBoundingClientRect();
            
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
        objWrapper.dataset.name = itemData.name;
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
        let startX, startY, startMouseX, startMouseY, startWidth, startHeight;

        const resizeHandle = obj.querySelector('.resize-handle');
        const rotateHandle = obj.querySelector('.rotate-handle');
        const dimDisplay = obj.querySelector('.dimension-display');

        obj.addEventListener('mousedown', e => {
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
            startWidth = obj.offsetWidth;
            startHeight = obj.offsetHeight;
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            document.body.style.cursor = 'nwse-resize';
        });

        // Rotation logic is not implemented, so this listener is empty for now
        rotateHandle.addEventListener('mousedown', e => { /* rotation logic placeholder */ });

        document.addEventListener('mousemove', e => {
            if (isDragging) {
                // Task 1: Constrain objects to room
                let newLeft = startX + e.clientX - startMouseX;
                let newTop = startY + e.clientY - startMouseY;

                const roomWidth = roomContainer.offsetWidth;
                const roomHeight = roomContainer.offsetHeight;
                const objWidth = obj.offsetWidth;
                const objHeight = obj.offsetHeight;

                newLeft = Math.max(0, Math.min(newLeft, roomWidth - objWidth));
                newTop = Math.max(0, Math.min(newTop, roomHeight - objHeight));

                obj.style.left = `${newLeft}px`;
                obj.style.top = `${newTop}px`;
            } else if (isResizing) {
                const newWidth = startWidth + (e.clientX - startMouseX);
                const newHeight = startHeight + (e.clientY - startMouseY);
                obj.style.width = `${Math.max(20, newWidth)}px`;
                obj.style.height = `${Math.max(20, newHeight)}px`;
                dimDisplay.textContent = `${Math.round(newWidth)} x ${Math.round(newHeight)} cm`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = isResizing = isRotating = false;
            document.body.style.cursor = 'default';
        });
    }
    
    // --- SELECTION AND DELETION LOGIC ---
    // **FIXED:** Restored full selection and deletion logic
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

    canvas.addEventListener('click', e => {
        if (e.target.id === 'canvas' || e.target.id === 'room-container') {
             deselectAll();
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (selectedObject) {
            selectedObject.remove();
            deselectAll();
        }
    });

    // --- NEW FUNCTIONS FOR SAVE AND TOGGLE ---

    // Task 2: Save layout
    function saveLayout() {
        const layoutData = {
            room: {
                width: roomContainer.offsetWidth,
                height: roomContainer.offsetHeight,
            },
            objects: [],
        };

        roomContainer.querySelectorAll('[id^="object-"]').forEach(obj => {
            const objectInfo = {
                type: obj.dataset.name,
                left: obj.offsetLeft,
                top: obj.offsetTop,
                width: obj.offsetWidth,
                height: obj.offsetHeight,
                rotation: obj.style.transform,
            };
            layoutData.objects.push(objectInfo);
        });

        const jsonString = JSON.stringify(layoutData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'room-layout.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Task 3: Toggle dimensions
    function toggleDimensionVisibility() {
        showDimensions = toggleDimsSwitch.checked;
        document.body.classList.toggle('hide-dims', !showDimensions);
    }

    saveBtn.addEventListener('click', saveLayout);
    toggleDimsSwitch.addEventListener('change', toggleDimensionVisibility);

    // --- START THE APP ---
    populateFurnitureList();
    initializeRoom();
    setupDropZone();
    toggleDimensionVisibility();
});