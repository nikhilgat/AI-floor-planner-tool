        let selectedElement = null;
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let furnitureCounter = 0;
        let currentView = 'isometric';

        // Initialize the application
        function init() {
            setupDragAndDrop();
            setupRoomControls();
            updateItemCount();
            setupViewControls();
        }

        // Setup drag and drop functionality
        function setupDragAndDrop() {
            const furnitureItems = document.querySelectorAll('.furniture-item');
            const roomFloor = document.getElementById('roomFloor');

            furnitureItems.forEach(item => {
                item.addEventListener('dragstart', handleDragStart);
            });

            roomFloor.addEventListener('dragover', handleDragOver);
            roomFloor.addEventListener('drop', handleDrop);
        }

        function handleDragStart(e) {
            e.dataTransfer.setData('text/plain', e.currentTarget.dataset.type);
            e.currentTarget.style.opacity = '0.6';
            
            setTimeout(() => {
                e.currentTarget.style.opacity = '1';
            }, 150);
        }

        function handleDragOver(e) {
            e.preventDefault();
        }

        function handleDrop(e) {
            e.preventDefault();
            const furnitureType = e.dataTransfer.getData('text/plain');
            const room = e.currentTarget;
            const rect = room.getBoundingClientRect();
            
            // Adjust coordinates based on current view
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            
            // Center the item and add some randomness
            x = Math.max(20, Math.min(x - 50, room.clientWidth - 150));
            y = Math.max(20, Math.min(y - 40, room.clientHeight - 100));
            
            createFurniture3D(furnitureType, x, y);
        }

        // Create 3D furniture elements
        function createFurniture3D(type, x, y) {
            const room = document.getElementById('roomFloor');
            const furniture = document.createElement('div');
            const id = `furniture_${++furnitureCounter}`;
            
            furniture.id = id;
            furniture.className = `placed-furniture ${type}`;
            furniture.style.left = x + 'px';
            furniture.style.top = y + 'px';
            furniture.style.zIndex = furnitureCounter + 10;
            
            // Create 3D model based on furniture type
            furniture.innerHTML = create3DModel(type);
            
            // Add event listeners
            furniture.addEventListener('mousedown', handleMouseDown);
            furniture.addEventListener('dblclick', handleDoubleClick);
            
            room.appendChild(furniture);
            updateItemCount();
            
            // Add entrance animation
            furniture.style.transform = 'scale(0) translateZ(50px)';
            furniture.style.opacity = '0';
            
            setTimeout(() => {
                furniture.style.transform = 'scale(1) translateZ(10px)';
                furniture.style.opacity = '1';
            }, 50);
        }

        // Create 3D models for different furniture types
        function create3DModel(type) {
            switch(type) {
                case 'bed':
                    return `
                        <div class="furniture-3d bed-3d">
                            <div class="bed-top">🛏️</div>
                            <div class="bed-side1"></div>
                            <div class="bed-side2"></div>
                        </div>
                    `;
                case 'wardrobe':
                    return `
                        <div class="furniture-3d wardrobe-3d">
                            <div class="wardrobe-top">🚪</div>
                            <div class="wardrobe-side1"></div>
                            <div class="wardrobe-side2"></div>
                        </div>
                    `;
                case 'study-table':
                    return `
                        <div class="furniture-3d study-table-3d">
                            <div class="study-table-top">📚</div>
                            <div class="study-table-side1"></div>
                            <div class="study-table-side2"></div>
                        </div>
                    `;
                case 'study-chair':
                    return `
                        <div class="furniture-3d study-chair-3d">
                            <div class="study-chair-top">💺</div>
                            <div class="study-chair-side1"></div>
                        </div>
                    `;
                case 'sofa':
                    return `
                        <div class="furniture-3d sofa-3d">
                            <div class="sofa-top">🛋️</div>
                            <div class="sofa-side1"></div>
                            <div class="sofa-side2"></div>
                        </div>
                    `;
                case 'bedside-table':
                    return `
                        <div class="furniture-3d bedside-table-3d">
                            <div class="bedside-table-top">🕯️</div>
                            <div class="bedside-table-side1"></div>
                            <div class="bedside-table-side2"></div>
                        </div>
                    `;
                default:
                    return '<div>📦</div>';
            }
        }

        // Handle mouse interactions
        function handleMouseDown(e) {
            e.preventDefault();
            selectedElement = e.currentTarget;
            isDragging = true;
            
            // Clear previous selection
            document.querySelectorAll('.placed-furniture').forEach(el => {
                el.classList.remove('selected');
            });
            selectedElement.classList.add('selected');
            
            const rect = selectedElement.getBoundingClientRect();
            const roomRect = document.getElementById('roomFloor').getBoundingClientRect();
            
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        function handleMouseMove(e) {
            if (!isDragging || !selectedElement) return;
            
            const room = document.getElementById('roomFloor');
            const roomRect = room.getBoundingClientRect();
            
            let newX = e.clientX - roomRect.left - dragOffset.x;
            let newY = e.clientY - roomRect.top - dragOffset.y;
            
            // Constrain to room boundaries
            newX = Math.max(10, Math.min(newX, room.clientWidth - selectedElement.offsetWidth - 10));
            newY = Math.max(10, Math.min(newY, room.clientHeight - selectedElement.offsetHeight - 10));
            
            selectedElement.style.left = newX + 'px';
            selectedElement.style.top = newY + 'px';
        }

        function handleMouseUp() {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
            }
            selectedElement = null;
            isDragging = false;
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        function handleDoubleClick(e) {
            e.preventDefault();
            const element = e.currentTarget;
            
            // Add removal animation
            element.style.transform = 'scale(0) rotateX(180deg) translateZ(-100px)';
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.remove();
                updateItemCount();
            }, 300);
        }

        // Setup room controls
        function setupRoomControls() {
            const roomWidthInput = document.getElementById('roomWidth');
            const roomHeightInput = document.getElementById('roomHeight');
            
            roomWidthInput.addEventListener('input', updateRoomSize);
            roomHeightInput.addEventListener('input', updateRoomSize);
        }

        function updateRoomSize() {
            const roomFloor = document.getElementById('roomFloor');
            const room3d = document.getElementById('room3d');
            const width = document.getElementById('roomWidth').value;
            const height = document.getElementById('roomHeight').value;
            
            roomFloor.style.width = width + 'px';
            roomFloor.style.height = height + 'px';
            room3d.style.width = width + 'px';
            room3d.style.height = height + 'px';
            
            // Adjust furniture positions if they're now outside the room
            const furniture = roomFloor.querySelectorAll('.placed-furniture');
            furniture.forEach(item => {
                const currentX = parseInt(item.style.left);
                const currentY = parseInt(item.style.top);
                
                const newX = Math.min(currentX, width - item.offsetWidth - 10);
                const newY = Math.min(currentY, height - item.offsetHeight - 10);
                
                item.style.left = Math.max(10, newX) + 'px';
                item.style.top = Math.max(10, newY) + 'px';
            });
        }

        // View controls
        function setupViewControls() {
            // Additional view setup can be added here
        }

        function setView(viewType) {
            const room3d = document.getElementById('room3d');
            const buttons = document.querySelectorAll('.view-btn');
            
            // Remove active class from all buttons
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            event.target.classList.add('active');
            
            currentView = viewType;
            
            switch(viewType) {
                case 'isometric':
                    room3d.style.transform = 'rotateX(60deg) rotateY(0deg) rotateZ(45deg) translateZ(0px)';
                    break;
                case 'top':
                    room3d.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateZ(-300px) translateY(-165px)';
                    break;
            }
        }

        // Floor texture changes
        function changeFloorTexture() {
            const floorTexture = document.getElementById('floorTexture').value;
            const roomFloor = document.getElementById('roomFloor');
            
            switch(floorTexture) {
                case 'tiles':
                    roomFloor.style.background = `
                        linear-gradient(45deg, 
                            rgba(236, 240, 241, 0.9) 25%, 
                            rgba(189, 195, 199, 0.1) 25%, 
                            rgba(189, 195, 199, 0.1) 50%, 
                            rgba(236, 240, 241, 0.9) 50%, 
                            rgba(236, 240, 241, 0.9) 75%, 
                            rgba(189, 195, 199, 0.1) 75%
                        )`;
                    roomFloor.style.backgroundSize = '40px 40px';
                    break;
                case 'wood':
                    roomFloor.style.background = `
                        linear-gradient(90deg, 
                            rgba(160, 82, 45, 0.8) 0%, 
                            rgba(210, 180, 140, 0.8) 25%, 
                            rgba(139, 69, 19, 0.8) 50%, 
                            rgba(205, 133, 63, 0.8) 75%, 
                            rgba(160, 82, 45, 0.8) 100%
                        )`;
                    roomFloor.style.backgroundSize = '120px 20px';
                    break;
                case 'carpet':
                    roomFloor.style.background = `
                        radial-gradient(circle, 
                            rgba(220, 20, 60, 0.3) 1px, 
                            rgba(139, 0, 139, 0.2) 1px, 
                            rgba(139, 0, 139, 0.2) 3px, 
                            transparent 3px
                        )`;
                    roomFloor.style.backgroundSize = '20px 20px';
                    break;
                case 'marble':
                    roomFloor.style.background = `
                        linear-gradient(45deg, 
                            rgba(248, 248, 255, 0.9) 25%, 
                            rgba(230, 230, 250, 0.7) 25%, 
                            rgba(230, 230, 250, 0.7) 50%, 
                            rgba(248, 248, 255, 0.9) 50%, 
                            rgba(248, 248, 255, 0.9) 75%, 
                            rgba(211, 211, 211, 0.5) 75%
                        )`;
                    roomFloor.style.backgroundSize = '60px 60px';
                    break;
            }
        }

        // Utility functions
        function updateItemCount() {
            const count = document.querySelectorAll('.placed-furniture').length;
            document.getElementById('itemCount').textContent = count;
        }

        function clearRoom() {
            if (confirm('🗑️ Clear all furniture from the room?')) {
                const furniture = document.querySelectorAll('.placed-furniture');
                furniture.forEach((item, index) => {
                    setTimeout(() => {
                        item.style.transform = 'scale(0) rotateY(360deg) translateZ(-200px)';
                        item.style.opacity = '0';
                        setTimeout(() => item.remove(), 400);
                    }, index * 100);
                });
                setTimeout(updateItemCount, furniture.length * 100 + 400);
            }
        }

        function randomLayout() {
            const furnitureTypes = ['bed', 'wardrobe', 'study-table', 'study-chair', 'sofa', 'bedside-table'];
            const room = document.getElementById('roomFloor');
            
            // Clear existing furniture first
            document.querySelectorAll('.placed-furniture').forEach(item => item.remove());
            
            // Add random furniture
            const numItems = Math.floor(Math.random() * 4) + 3; // 3-6 items
            
            for (let i = 0; i < numItems; i++) {
                setTimeout(() => {
                    const randomType = furnitureTypes[Math.floor(Math.random() * furnitureTypes.length)];
                    const x = Math.random() * (room.clientWidth - 150) + 20;
                    const y = Math.random() * (room.clientHeight - 100) + 20;
                    
                    createFurniture3D(randomType, x, y);
                }, i * 300);
            }
        }

        function saveLayout() {
            const furniture = [];
            document.querySelectorAll('.placed-furniture').forEach(item => {
                const classList = Array.from(item.classList);
                const type = classList.find(cls => cls !== 'placed-furniture');
                
                furniture.push({
                    type: type,
                    x: parseInt(item.style.left),
                    y: parseInt(item.style.top),
                    id: item.id
                });
            });
            
            const layout = {
                furniture: furniture,
                roomWidth: document.getElementById('roomWidth').value,
                roomHeight: document.getElementById('roomHeight').value,
                floorTexture: document.getElementById('floorTexture').value,
                view: currentView,
                timestamp: new Date().toISOString(),
                version: "3D Room Planner v1.0"
            };
            
            const dataStr = JSON.stringify(layout, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `room_design_${new Date().toISOString().slice(0,10)}.json`;
            link.click();
            
            // Show success message
            showNotification('💾 Design saved successfully!', 'success');
        }

        function loadLayout() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const layout = JSON.parse(e.target.result);
                        
                        // Clear existing furniture
                        document.querySelectorAll('.placed-furniture').forEach(item => item.remove());
                        
                        // Set room properties
                        document.getElementById('roomWidth').value = layout.roomWidth;
                        document.getElementById('roomHeight').value = layout.roomHeight;
                        document.getElementById('floorTexture').value = layout.floorTexture || 'tiles';
                        
                        updateRoomSize();
                        changeFloorTexture();
                        
                        // Set view if available
                        if (layout.view) {
                            setView(layout.view);
                        }
                        
                        // Add furniture with delay for smooth animation
                        furnitureCounter = 0;
                        layout.furniture.forEach((item, index) => {
                            setTimeout(() => {
                                createFurniture3D(item.type, item.x, item.y);
                            }, index * 200);
                        });
                        
                        showNotification('📂 Design loaded successfully!', 'success');
                    } catch (error) {
                        showNotification('❌ Error loading design: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        }

        function exportImage() {
            showNotification('📸 Screenshot feature coming soon! Use browser screenshot for now.', 'info');
        }

        // Notification system
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 300px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            `;
            
            switch(type) {
                case 'success':
                    notification.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
                    break;
                case 'error':
                    notification.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
                    break;
                default:
                    notification.style.background = 'linear-gradient(45deg, #3498db, #2c3e50)';
            }
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Slide in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Slide out and remove
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Initialize the application when the page loads
        document.addEventListener('DOMContentLoaded', init);

        // Prevent context menu on furniture items
        document.addEventListener('contextmenu', function(e) {
            if (e.target.closest('.placed-furniture')) {
                e.preventDefault();
            }
        });

        // Add some keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Delete' && selectedElement) {
                handleDoubleClick({ preventDefault: () => {}, currentTarget: selectedElement });
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveLayout();
            }
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                loadLayout();
            }
            if (e.key === 'Escape') {
                if (selectedElement) {
                    selectedElement.classList.remove('selected');
                    selectedElement = null;
                }
            }
        });