document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const furnitureList = document.getElementById('furniture-list');
    const architecturalList = document.getElementById('architectural-list');
    const canvas = document.getElementById('canvas');
    const deleteBtn = document.getElementById('delete-btn');
    const saveBtn = document.getElementById('save-btn');
    const toggleDimsSwitch = document.getElementById('toggle-dims-switch');
    const loadBtn = document.getElementById('load-btn');
    const loadLayoutInput = document.getElementById('load-layout-input');
    const contextualSettings = document.getElementById('contextual-settings');
    let roomContainer;

    // --- STATE ---
    let selectedObject = null;
    let objectCounter = 0;

    // --- CATALOGS ---
    const furnitureCatalog = [
        { name: 'Sofa', image: '/static/images/sofa.svg', width: 200, height: 90, zHeight: 85 },
        { name: 'Study Table', image: '/static/images/study_table.svg', width: 120, height: 70, zHeight: 75 },
        { name: 'Study Chair', image: '/static/images/study_chair.svg', width: 50, height: 50, zHeight: 90 },
        { name: 'Bed', image: '/static/images/bed.svg', width: 180, height: 200, zHeight: 55 },
        { name: 'Wardrobe', image: '/static/images/wardrobe.svg', width: 150, height: 60, zHeight: 200 },
        { name: 'Bedside Table', image: '/static/images/bedside_table.svg', width: 45, height: 45, zHeight: 60 },
    ];
    const architecturalCatalog = [
        { name: 'Door', type: 'door', image: '/static/images/door.svg', width: 90, openingHeight: 210 },
        { name: 'Window', type: 'window', image: '/static/images/window.svg', width: 120, openingHeight: 100 }
    ];

    // --- HELPER & UTILITY FUNCTIONS ---
    const getRotationAngle = (obj) => {
        const match = obj.style.transform.match(/rotate\(([^deg]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
    };

    const updateFurnitureDimensionLabel = (obj) => {
        const dimDisplay = obj.querySelector('.dimension-display');
        if (!dimDisplay) return;
        const angle = getRotationAngle(obj);
        dimDisplay.textContent = `${obj.offsetWidth}x${obj.offsetHeight}x${obj.dataset.zHeight} cm (${Math.round(angle)}°)`;
    };

    const updateWallFeatureDimensionLabel = (obj) => {
        const dimDisplay = obj.querySelector('.dimension-display');
        if (!dimDisplay) return;
        const width = obj.classList.contains('on-vertical-wall') ? obj.offsetHeight : obj.offsetWidth;
        if (obj.classList.contains('window')) {
            dimDisplay.textContent = `W:${width}, H:${obj.dataset.openingHeight}, Sill:${obj.dataset.heightFromGround} cm`;
        } else {
            dimDisplay.textContent = `W:${width}, H:${obj.dataset.openingHeight} cm`;
        }
    };

    const updateRoomDimensions = () => {
        const display = roomContainer.querySelector('.room-dimension');
        if (display) display.textContent = `${roomContainer.offsetWidth} x ${roomContainer.offsetHeight} cm`;
    };

    // --- COLLISION DETECTION (SAT) ---
    function getVertices(obj) {
        const box = { x: obj.offsetLeft, y: obj.offsetTop, w: obj.offsetWidth, h: obj.offsetHeight };
        const angle = getRotationAngle(obj) * Math.PI / 180;
        const cos = Math.cos(angle); const sin = Math.sin(angle);
        const cx = box.x + box.w / 2; const cy = box.y + box.h / 2;
        const vertices = [];
        for (let i = 0; i < 4; i++) {
            const w_half = (i < 2 ? box.w : -box.w) / 2;
            const h_half = (i % 3 === 0 ? box.h : -box.h) / 2;
            vertices.push({
                x: cx + (w_half * cos - h_half * sin),
                y: cy + (w_half * sin + h_half * cos),
            });
        }
        return vertices;
    }

    function checkCollision(obj1, obj2) {
        const v1 = getVertices(obj1); const v2 = getVertices(obj2);
        const axes = [v1[0].x-v1[1].x, v1[0].y-v1[1].y, v1[1].x-v1[2].x, v1[1].y-v1[2].y, v2[0].x-v2[1].x, v2[0].y-v2[1].y, v2[1].x-v2[2].x, v2[1].y-v2[2].y].map((val,i,arr)=>i%2===0?{x:-arr[i+1],y:val}:null).filter(v=>v);
        for(let axis of axes) {
            let p1 = v1.map(v => v.x*axis.x + v.y*axis.y);
            let p2 = v2.map(v => v.x*axis.x + v.y*axis.y);
            let [min1, max1] = [Math.min(...p1), Math.max(...p1)];
            let [min2, max2] = [Math.min(...p2), Math.max(...p2)];
            if(max1 < min2 || max2 < min1) return false;
        }
        return true;
    }

    function isOverlapping(movingObj, potentialState) {
        const clone = movingObj.cloneNode(false);
        clone.style.left = `${potentialState.x}px`; clone.style.top = `${potentialState.y}px`;
        clone.style.width = `${potentialState.width}px`; clone.style.height = `${potentialState.height}px`;
        clone.style.transform = `rotate(${potentialState.rotation}deg)`;
        const otherObjects = [...roomContainer.querySelectorAll('.furniture')].filter(child => child.id !== movingObj.id);
        for (let other of otherObjects) {
            if (checkCollision(clone, other)) return true;
        }
        return false;
    }

    // --- INITIALIZATION ---
    function populateSidebar() {
        [furnitureList, architecturalList].forEach(list => list.innerHTML = '');
        const createSidebarItem = (item) => {
            const div = document.createElement('div');
            div.className = 'bg-gray-100 p-2 rounded-lg hover:bg-blue-100 cursor-grab flex flex-col items-center space-y-2';
            div.draggable = true;
            div.dataset.item = JSON.stringify(item);
            div.innerHTML = `<img src="${item.image}" class="w-24 h-24 object-contain" draggable="false"><span class="font-semibold text-sm">${item.name}</span>`;
            div.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', e.currentTarget.dataset.item));
            return div;
        };
        furnitureCatalog.forEach(item => furnitureList.appendChild(createSidebarItem(item)));
        architecturalCatalog.forEach(item => architecturalList.appendChild(createSidebarItem(item)));
    }

    // --- OBJECT/FEATURE CREATION ---
    function createFurnitureObject(itemData, pos) {
        objectCounter++;
        const obj = document.createElement('div');
        obj.id = `object-${objectCounter}`;
        obj.className = 'furniture';
        obj.style.left = `${pos.x}px`; obj.style.top = `${pos.y}px`;
        obj.style.width = `${itemData.width}px`; obj.style.height = `${itemData.height}px`;
        obj.style.transform = `rotate(${pos.rotation || 0}deg)`;
        obj.dataset.name = itemData.name; obj.dataset.zHeight = itemData.zHeight;
        obj.innerHTML = `<img src="${itemData.image}" class="w-full h-full pointer-events-none"><div class="handle resize-handle"></div><div class="handle rotate-handle"></div><div class="dimension-display"></div>`;
        roomContainer.appendChild(obj);
        addFurnitureEventListeners(obj);
        updateFurnitureDimensionLabel(obj);
        selectObject(obj);
    }

    function createWallFeature(type, options = {}) {
        objectCounter++;
        const feature = document.createElement('div');
        feature.id = `object-${objectCounter}`; feature.className = `wall-feature ${type}`;
        feature.dataset.name = type;
        const wall = options.wall || 'top';
        const catalogItem = architecturalCatalog.find(item => item.type === type);
        const size = options.size || catalogItem.width;
        let position = options.position || 100;
        feature.dataset.wall = wall;
        feature.dataset.openingHeight = options.openingHeight || catalogItem.openingHeight;
        if (type === 'window') feature.dataset.heightFromGround = options.heightFromGround || 90;

        const wallThickness = 10;
        if (wall === 'top' || wall === 'bottom') {
            feature.style.width = `${size}px`; feature.style.height = `${wallThickness}px`;
            position = Math.max(0, Math.min(position, roomContainer.offsetWidth - size));
            feature.style.left = `${position}px`;
            feature.style.top = wall === 'top' ? `-${wallThickness/2}px` : `${roomContainer.offsetHeight - wallThickness/2}px`;
        } else {
            feature.classList.add('on-vertical-wall');
            feature.style.height = `${size}px`; feature.style.width = `${wallThickness}px`;
            position = Math.max(0, Math.min(position, roomContainer.offsetHeight - size));
            feature.style.top = `${position}px`;
            feature.style.left = wall === 'left' ? `-${wallThickness/2}px` : `${roomContainer.offsetWidth - wallThickness/2}px`;
        }
        feature.innerHTML = `<div class="dimension-display"></div>`;
        roomContainer.appendChild(feature);
        addWallFeatureEventListeners(feature);
        updateWallFeatureDimensionLabel(feature);
        selectObject(feature);
    }
    
    // --- EVENT LISTENERS ---
    function addFurnitureEventListeners(obj) {
        const rotateHandle = obj.querySelector('.rotate-handle');
        const resizeHandle = obj.querySelector('.resize-handle');

        obj.addEventListener('mousedown', e => {
            if (e.target.classList.contains('furniture')) {
                selectObject(obj);
                let isDragging = true;
                const startMouseX = e.clientX; const startMouseY = e.clientY;
                const startCenterX = obj.offsetLeft + obj.offsetWidth / 2;
                const startCenterY = obj.offsetTop + obj.offsetHeight / 2;
                document.body.style.cursor = 'move'; e.stopPropagation();

                function dragMove(e) {
                    if (!isDragging) return;
                    let newCenterX = startCenterX + (e.clientX - startMouseX);
                    let newCenterY = startCenterY + (e.clientY - startMouseY);
                    const angleRad = getRotationAngle(obj) * Math.PI / 180;
                    const w = obj.offsetWidth; const h = obj.offsetHeight;
                    const rotatedHalfWidth = (Math.abs(Math.cos(angleRad))*w + Math.abs(Math.sin(angleRad))*h) / 2;
                    const rotatedHalfHeight = (Math.abs(Math.sin(angleRad))*w + Math.abs(Math.cos(angleRad))*h) / 2;
                    newCenterX = Math.max(rotatedHalfWidth, Math.min(newCenterX, roomContainer.offsetWidth - rotatedHalfWidth));
                    newCenterY = Math.max(rotatedHalfHeight, Math.min(newCenterY, roomContainer.offsetHeight - rotatedHalfHeight));
                    const potentialState = {x:newCenterX-w/2, y:newCenterY-h/2, width:w, height:h, rotation:getRotationAngle(obj)};
                    if (!isOverlapping(obj, potentialState)) {
                        obj.style.left = `${potentialState.x}px`; obj.style.top = `${potentialState.y}px`;
                        obj.classList.remove('colliding');
                    } else {
                        obj.classList.add('colliding');
                    }
                }
                function dragEnd() {
                    isDragging = false; obj.classList.remove('colliding');
                    document.body.style.cursor = 'default';
                    document.removeEventListener('mousemove', dragMove);
                    document.removeEventListener('mouseup', dragEnd);
                }
                document.addEventListener('mousemove', dragMove);
                document.addEventListener('mouseup', dragEnd);
            }
        });

        resizeHandle.addEventListener('mousedown', e => {
            e.stopPropagation(); selectObject(obj);
            let isResizing = true;
            const startWidth = obj.offsetWidth; const startHeight = obj.offsetHeight;
            const startMouseX = e.clientX; const startMouseY = e.clientY;
            
            function resizeMove(e) {
                if (!isResizing) return;
                const newWidth = startWidth + (e.clientX - startMouseX);
                const newHeight = startHeight + (e.clientY - startMouseY);
                const potentialState = {x:obj.offsetLeft, y:obj.offsetTop, width:newWidth, height:newHeight, rotation:getRotationAngle(obj)};
                if (!isOverlapping(obj, potentialState)) {
                    obj.style.width = `${Math.max(20, newWidth)}px`; obj.style.height = `${Math.max(20, newHeight)}px`;
                    updateFurnitureDimensionLabel(obj); obj.classList.remove('colliding');
                } else {
                    obj.classList.add('colliding');
                }
            }
            function resizeEnd() {
                isResizing = false; obj.classList.remove('colliding');
                document.removeEventListener('mousemove', resizeMove);
                document.removeEventListener('mouseup', resizeEnd);
            }
            document.addEventListener('mousemove', resizeMove);
            document.addEventListener('mouseup', resizeEnd);
        });

        rotateHandle.addEventListener('mousedown', e => {
            e.stopPropagation(); selectObject(obj);
            let isRotating = true;
            const rect = obj.getBoundingClientRect();
            const objectCenterX = rect.left + rect.width/2; const objectCenterY = rect.top + rect.height/2;
            const startAngle = getRotationAngle(obj);
            const startMouseAngle = Math.atan2(e.clientY-objectCenterY, e.clientX-objectCenterX) * (180/Math.PI);

            function rotateMove(e) {
                if (!isRotating) return;
                const currentMouseAngle = Math.atan2(e.clientY-objectCenterY, e.clientX-objectCenterX) * (180/Math.PI);
                const rawRotation = startAngle + (currentMouseAngle - startMouseAngle);
                let finalRotation = rawRotation; let isSnapped = false;
                for (let angle of [0, 90, 180, 270, 360, -90, -180, -270]) {
                    if (Math.abs(rawRotation - angle) < 10) {
                        finalRotation = angle % 360; isSnapped = true; break;
                    }
                }
                const potentialState = {x:obj.offsetLeft, y:obj.offsetTop, width:obj.offsetWidth, height:obj.offsetHeight, rotation:finalRotation};
                if (!isOverlapping(obj, potentialState)) {
                    rotateHandle.classList.toggle('snapped', isSnapped);
                    obj.style.transform = `rotate(${finalRotation}deg)`;
                    updateFurnitureDimensionLabel(obj);
                    obj.classList.remove('colliding');
                } else {
                    obj.classList.add('colliding');
                }
            }
            function rotateEnd() {
                isRotating = false; rotateHandle.classList.remove('snapped'); obj.classList.remove('colliding');
                document.removeEventListener('mousemove', rotateMove);
                document.removeEventListener('mouseup', rotateEnd);
            }
            document.addEventListener('mousemove', rotateMove);
            document.addEventListener('mouseup', rotateEnd);
        });
    }

    function addWallFeatureEventListeners(obj) {
        let action = null;
        let startMousePos, startObjPos, startSize;
        const isVertical = obj.classList.contains('on-vertical-wall');

        obj.addEventListener('mousemove', e => {
            if (action) return;
            const rect = obj.getBoundingClientRect();
            const clickPos = isVertical ? e.clientY : e.clientX;
            const startEdge = isVertical ? rect.top : rect.left;
            const endEdge = isVertical ? rect.bottom : rect.right;
            obj.style.cursor = (Math.abs(clickPos - startEdge) < 10 || Math.abs(clickPos - endEdge) < 10) ? (isVertical ? 'ns-resize' : 'ew-resize') : 'move';
        });

        obj.addEventListener('mousedown', e => {
            e.stopPropagation(); selectObject(obj);
            const rect = obj.getBoundingClientRect();
            const clickPos = isVertical ? e.clientY : e.clientX;
            const startEdge = isVertical ? rect.top : rect.left;
            const endEdge = isVertical ? rect.bottom : rect.right;
            if (Math.abs(clickPos - startEdge) < 10) action = 'resize-start';
            else if (Math.abs(clickPos - endEdge) < 10) action = 'resize-end';
            else action = 'drag';
            startMousePos = isVertical ? e.clientY : e.clientX;
            startObjPos = isVertical ? obj.offsetTop : obj.offsetLeft;
            startSize = isVertical ? obj.offsetHeight : obj.offsetWidth;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!action) return;
            e.preventDefault();
            const currentMousePos = isVertical ? e.clientY : e.clientX;
            const delta = currentMousePos - startMousePos;

            if (action === 'drag') {
                if (isVertical) {
                    let newTop = startObjPos + delta;
                    newTop = Math.max(0, Math.min(newTop, roomContainer.offsetHeight - obj.offsetHeight));
                    obj.style.top = `${newTop}px`;
                } else {
                    let newLeft = startObjPos + delta;
                    newLeft = Math.max(0, Math.min(newLeft, roomContainer.offsetWidth - obj.offsetWidth));
                    obj.style.left = `${newLeft}px`;
                }
            } else { // Resizing
                if (isVertical) {
                    if (action === 'resize-start') {
                        const newHeight = startSize - delta;
                        if (newHeight > 30) {
                            obj.style.height = `${newHeight}px`;
                            obj.style.top = `${startObjPos + delta}px`;
                        }
                    } else { // resize-end
                        const newHeight = startSize + delta;
                        if (newHeight > 30) obj.style.height = `${newHeight}px`;
                    }
                } else { // Horizontal
                    if (action === 'resize-start') {
                        const newWidth = startSize - delta;
                        if (newWidth > 30) {
                            obj.style.width = `${newWidth}px`;
                            obj.style.left = `${startObjPos + delta}px`;
                        }
                    } else { // resize-end
                        const newWidth = startSize + delta;
                        if (newWidth > 30) obj.style.width = `${newWidth}px`;
                    }
                }
                updateWallFeatureDimensionLabel(obj);
            }
        }
        function onMouseUp() { action = null; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); }
    }
    
    // --- ROOM RESIZING ---
    function addRoomResizeListener(handle, position) {
        handle.addEventListener('mousedown', e => {
            e.stopPropagation(); let isResizing = true;
            const startX = e.clientX; const startY = e.clientY;
            const startWidth = roomContainer.offsetWidth; const startHeight = roomContainer.offsetHeight;
            document.body.style.cursor = handle.style.cursor;
            function resizeMove(e) {
                if (!isResizing) return;
                const dx = e.clientX - startX; const dy = e.clientY - startY;
                let newWidth = startWidth, newHeight = startHeight;
                if (position.includes('right')) newWidth += dx;
                if (position.includes('left')) newWidth -= dx;
                if (position.includes('bottom')) newHeight += dy;
                if (position.includes('top')) newHeight -= dy;
                roomContainer.style.width = `${Math.max(200, newWidth)}px`;
                roomContainer.style.height = `${Math.max(200, newHeight)}px`;
                updateRoomDimensions();
                updateWallFeaturesPosition();
            }
            function resizeEnd() {
                isResizing = false; document.body.style.cursor = 'default';
                document.removeEventListener('mousemove', resizeMove);
                document.removeEventListener('mouseup', resizeEnd);
            }
            document.addEventListener('mousemove', resizeMove);
            document.addEventListener('mouseup', resizeEnd);
        });
    }

    function updateWallFeaturesPosition() {
        roomContainer.querySelectorAll('.wall-feature').forEach(obj => {
            const wall = obj.dataset.wall;
            const isVertical = obj.classList.contains('on-vertical-wall');
            if (wall === 'bottom') obj.style.top = `${roomContainer.offsetHeight - 5}px`;
            else if (wall === 'right') obj.style.left = `${roomContainer.offsetWidth - 5}px`;
            if (!isVertical) {
                const maxLeft = roomContainer.offsetWidth - obj.offsetWidth;
                if (obj.offsetLeft > maxLeft) obj.style.left = `${maxLeft}px`;
            } else {
                const maxTop = roomContainer.offsetHeight - obj.offsetHeight;
                if (obj.offsetTop > maxTop) obj.style.top = `${maxTop}px`;
            }
        });
    }

    // --- SELECTION & UI ---
    function selectObject(obj) {
        if (selectedObject) selectedObject.classList.remove('selected');
        selectedObject = obj;
        contextualSettings.innerHTML = '';
        if (!obj) {
            deleteBtn.disabled = true;
            return;
        }
        selectedObject.classList.add('selected');
        deleteBtn.disabled = false;
        if (obj.classList.contains('furniture')) {
            contextualSettings.innerHTML = `<label for="cs-height" class="text-sm">Height(cm):</label><input type="number" id="cs-height" class="w-20 border-gray-300 rounded-md shadow-sm text-sm" value="${obj.dataset.zHeight}"><button id="cs-set-height" class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Set</button>`;
            document.getElementById('cs-set-height').addEventListener('click', () => { obj.dataset.zHeight = document.getElementById('cs-height').value; updateFurnitureDimensionLabel(obj); });
        } else if (obj.classList.contains('window')) {
            contextualSettings.innerHTML = `<label for="cs-sill" class="text-sm">Sill(cm):</label><input type="number" id="cs-sill" class="w-20 border-gray-300 rounded-md text-sm" value="${obj.dataset.heightFromGround}"><label for="cs-o-height" class="text-sm">Height(cm):</label><input type="number" id="cs-o-height" class="w-20 border-gray-300 rounded-md text-sm" value="${obj.dataset.openingHeight}">`;
            document.getElementById('cs-sill').addEventListener('change', e => { obj.dataset.heightFromGround = e.target.value; updateWallFeatureDimensionLabel(obj); });
            document.getElementById('cs-o-height').addEventListener('change', e => { obj.dataset.openingHeight = e.target.value; updateWallFeatureDimensionLabel(obj); });
        } else if (obj.classList.contains('door')) {
            contextualSettings.innerHTML = `<label for="cs-o-height" class="text-sm">Height(cm):</label><input type="number" id="cs-o-height" class="w-20 border-gray-300 rounded-md text-sm" value="${obj.dataset.openingHeight}"><button id="cs-set-o-height" class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Set</button>`;
            document.getElementById('cs-set-o-height').addEventListener('click', () => { obj.dataset.openingHeight = document.getElementById('cs-o-height').value; updateWallFeatureDimensionLabel(obj); });
        }
    }
    const deselectAll = () => selectObject(null);

    // --- DRAG & DROP ---
    function findClosestWall(x, y, roomWidth, roomHeight) {
        const dists = { top: y, bottom: roomHeight - y, left: x, right: roomWidth - x };
        const closest = Object.keys(dists).reduce((a, b) => dists[a] < dists[b] ? a : b);
        let position = (closest === 'top' || closest === 'bottom') ? x : y;
        return { name: closest, position: position };
    }

    function handleDrop(e) {
        e.preventDefault();
        const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const roomRect = roomContainer.getBoundingClientRect();
        const x = e.clientX - roomRect.left; const y = e.clientY - roomRect.top;
        if (itemData.type === 'door' || itemData.type === 'window') {
            const closestWall = findClosestWall(x, y, roomContainer.offsetWidth, roomContainer.offsetHeight);
            createWallFeature(itemData.type, { wall: closestWall.name, position: closestWall.position - (itemData.width / 2) });
        } else {
            const pos = { x: x - (itemData.width / 2), y: y - (itemData.height / 2) };
            const dummy = document.createElement('div'); dummy.id = 'dummy';
            if (!isOverlapping(dummy, { ...pos, width: itemData.width, height: itemData.height, rotation: 0 })) {
                createFurnitureObject(itemData, pos);
            } else { console.warn("Cannot place object here: Overlap detected."); }
        }
    }

    // --- SAVE/LOAD ---
    function saveLayout() {
        const layoutData = { room: { width: roomContainer.offsetWidth, height: roomContainer.offsetHeight }, furniture: [], openings: [] };
        roomContainer.querySelectorAll('.furniture').forEach(obj => { layoutData.furniture.push({ name: obj.dataset.name, x: obj.offsetLeft, y: obj.offsetTop, width: obj.offsetWidth, height: obj.offsetHeight, zHeight: obj.dataset.zHeight, rotation: getRotationAngle(obj) }); });
        roomContainer.querySelectorAll('.wall-feature').forEach(obj => {
            const isVertical = obj.classList.contains('on-vertical-wall');
            const opening = { type: obj.dataset.name, wall: obj.dataset.wall, position: isVertical ? obj.offsetTop : obj.offsetLeft, size: isVertical ? obj.offsetHeight : obj.offsetWidth, openingHeight: obj.dataset.openingHeight };
            if (opening.type === 'window') opening.heightFromGround = obj.dataset.heightFromGround;
            layoutData.openings.push(opening);
        });
        const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'room-layout.json'; a.click();
        URL.revokeObjectURL(a.href);
    }
    
    function buildLayoutFromJSON(data) {
        deselectAll(); canvas.innerHTML = '';
        initializeApp(data.room.width, data.room.height);
        (data.openings || []).forEach(o => createWallFeature(o.type, o));
        (data.furniture || []).forEach(f => {
            const catalogItem = furnitureCatalog.find(item => item.name === f.name);
            if (catalogItem) {
                const itemData = { ...catalogItem, width: f.width, height: f.height, zHeight: f.zHeight };
                const pos = { x: f.x, y: f.y, rotation: f.rotation };
                createFurnitureObject(itemData, pos);
            }
        });
        deselectAll();
    }

    // --- INITIALIZE APP ---
    function initializeApp(width = 800, height = 600) {
        canvas.innerHTML = '';
        roomContainer = document.createElement('div');
        roomContainer.id = 'room-container';
        roomContainer.style.width = `${width}px`; roomContainer.style.height = `${height}px`;
        canvas.appendChild(roomContainer);
        const roomDimDisplay = document.createElement('div');
        roomDimDisplay.className = 'dimension-display room-dimension';
        roomContainer.appendChild(roomDimDisplay);
        updateRoomDimensions();
        ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `handle room-handle ${pos}`;
            roomContainer.appendChild(handle);
            addRoomResizeListener(handle, pos);
        });
        roomContainer.addEventListener('dragover', e => e.preventDefault());
        roomContainer.addEventListener('drop', handleDrop);
    }

    // --- BIND TOP-LEVEL EVENT LISTENERS ---
    deleteBtn.addEventListener('click', () => { if (selectedObject) { selectedObject.remove(); deselectAll(); } });
    canvas.addEventListener('click', e => { if (e.target.id === 'canvas' || e.target.id === 'room-container') deselectAll(); });
    loadBtn.addEventListener('click', () => loadLayoutInput.click());
    loadLayoutInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
                try { buildLayoutFromJSON(JSON.parse(re.target.result)); }
                catch(err) { alert('Error: Could not load layout from file.'); console.error(err); }
            };
            reader.readAsText(file);
            e.target.value = null;
        }
    });
    saveBtn.addEventListener('click', saveLayout);
    toggleDimsSwitch.addEventListener('change', () => document.body.classList.toggle('hide-dims', !toggleDimsSwitch.checked));
    
    // --- APP START ---
    populateSidebar();
    initializeApp();
});