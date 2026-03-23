document.addEventListener('DOMContentLoaded', function() {
    class Dashboard {
        constructor(config) {
            this.urls = config.urls;
            this.csrfToken = config.csrfToken;
            this.initTabs();
            this.initCreateTabs();
            this.initModals();
            this.initDragAndDrop();
            this.initPreviewButtons();
            this.initFolderToggles();
            this.handleUrlParams();
            this.initTemplateCreation();
        }

        initTabs() {
            const tabLinks = document.querySelectorAll('.tab-link');
            tabLinks.forEach(link => {
                link.addEventListener('click', (event) => this.openTab(event.currentTarget.dataset.tab));
            });
        }
        
        openTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            document.querySelectorAll('.tab-link').forEach(tl => tl.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            document.querySelector(`.tab-link[data-tab='${tabName}']`).classList.add('active');
        }

        initCreateTabs() {
            const createTabLinks = document.querySelectorAll('.create-tab-link');
            createTabLinks.forEach(link => {
                link.addEventListener('click', (event) => this.openCreateTab(event.currentTarget.dataset.tab));
            });
        }

        openCreateTab(tabName) {
            document.querySelectorAll('.create-tab-content').forEach(tc => tc.classList.remove('active'));
            document.querySelectorAll('.create-tab-link').forEach(tl => tl.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            document.querySelector(`.create-tab-link[data-tab='${tabName}']`).classList.add('active');
        }

        initModals() {
            const folderModal = document.getElementById("folder-modal");
            document.getElementById("fab").onclick = () => folderModal.style.display = "flex";
            folderModal.querySelector(".close-button").onclick = () => folderModal.style.display = "none";
            folderModal.onclick = (event) => {
                if (event.target === folderModal) {
                    folderModal.style.display = "none";
                }
            };

            const templateModal = document.getElementById("template-modal");
            document.getElementById("show-template-modal-btn").onclick = () => templateModal.style.display = "flex";
            templateModal.querySelector(".close-button").onclick = () => templateModal.style.display = "none";
            templateModal.onclick = (event) => {
                if (event.target === templateModal) {
                    templateModal.style.display = "none";
                }
            };
        }

        initDragAndDrop() {
            document.querySelectorAll('.grid-container').forEach(grid => {
                new Sortable(grid, { group: 'shared', animation: 150, onEnd: (evt) => this.handleDrop(evt) });
            });
        }

        handleDrop(evt) {
            const productId = evt.item.dataset.id;
            const toFolderId = evt.to.dataset.folderId;

            fetch(this.urls.updateProductFolder, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                body: JSON.stringify({ 'product_id': productId, 'folder_id': toFolderId === 'null' ? null : toFolderId })
            });

            requestAnimationFrame(() => {
                const toGrid = evt.to;
                if (toGrid.parentElement.classList.contains('folder-content')) {
                    const folderContent = toGrid.parentElement;
                    const folderHeader = folderContent.previousElementSibling;
                    if (folderHeader.classList.contains('open')) {
                        folderContent.style.maxHeight = `${folderContent.scrollHeight}px`;
                    }
                }
            });
        }

        initPreviewButtons() {
            document.getElementById('custom-preview-btn').addEventListener('click', () => {
                const text = document.getElementById('id_text_description').value;
                this.speak(text);
            });
            document.querySelectorAll('.preview-btn').forEach(button => {
                button.addEventListener('click', event => {
                    const description = event.currentTarget.closest('.grid-item').dataset.description;
                    this.speak(description);
                });
            });
        }

        speak(text) {
            if (text && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.8;
                window.speechSynthesis.speak(utterance);
            }
        }

        initFolderToggles() {
            document.querySelectorAll('.folder-header').forEach(header => {
                header.addEventListener('click', (event) => {
                    if (!event.target.closest('.folder-actions')) {
                        header.classList.toggle('open');
                        const content = header.nextElementSibling;
                        content.style.maxHeight = content.style.maxHeight ? null : `${content.scrollHeight}px`;
                    }
                });
            });
        }
        
        handleUrlParams() {
            const tabToOpen = new URLSearchParams(window.location.search).get('tab') || 'catalog';
            this.openTab(tabToOpen);
        }

        initTemplateCreation() {
            const form = document.getElementById('template-creation-form');
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(form);
                
                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-CSRFToken': this.csrfToken }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'ok') {
                        const templateList = document.getElementById('template-list');
                        const newLink = document.createElement('a');
                        newLink.href = data.url;
                        newLink.textContent = data.name;
                        const newLi = document.createElement('li');
                        newLi.appendChild(newLink);
                        templateList.appendChild(newLi);
                        
                        form.reset();
                        document.getElementById('template-modal').style.display = 'none';
                    } else {
                        alert('Error creating template: ' + data.message);
                    }
                });
            });
        }
    }

    new Dashboard(dashboardConfig);
});
