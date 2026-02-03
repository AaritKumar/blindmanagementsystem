document.addEventListener('DOMContentLoaded', function() {
    class Dashboard {
        constructor(config) {
            this.urls = config.urls;
            this.csrfToken = config.csrfToken;
            this.initTabs();
            this.initModals();
            this.initDragAndDrop();
            this.initPreviewButtons();
            this.initFolderToggles();
            this.handleUrlParams();
        }

        initTabs() {
            const tabLinks = document.querySelectorAll('.tab-link');
            tabLinks.forEach(link => {
                link.addEventListener('click', (event) => this.openTab(event, event.currentTarget.dataset.tab));
            });
        }

        openTab(evt, tabName) {
            document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
            document.querySelectorAll('.tab-link').forEach(tl => tl.classList.remove('active'));
            document.getElementById(tabName).style.display = 'block';
            
            let target = evt.currentTarget || document.querySelector(`.tab-link[data-tab='${tabName}']`);
            target.classList.add('active');
        }

        initModals() {
            const folderModal = document.getElementById("folder-modal");
            document.getElementById("fab").onclick = () => folderModal.style.display = "block";
            folderModal.querySelector(".close-button").onclick = () => folderModal.style.display = "none";

            const templateModal = document.getElementById("template-modal");
            const templateFab = document.getElementById("template-fab");
            if (templateFab) {
                templateFab.onclick = () => templateModal.style.display = "block";
                templateModal.querySelector(".close-button").onclick = () => templateModal.style.display = "none";
            }

            window.onclick = (event) => {
                if (event.target === folderModal || event.target === templateModal) {
                    folderModal.style.display = "none";
                    if (templateModal) templateModal.style.display = "none";
                }
            };
        }

        initDragAndDrop() {
            document.querySelectorAll('.grid-container').forEach(grid => {
                new Sortable(grid, {
                    group: 'shared',
                    animation: 150,
                    ghostClass: 'blue-background-class',
                    onEnd: (evt) => this.handleDrop(evt)
                });
            });
        }

        handleDrop(evt) {
            const productId = evt.item.dataset.id;
            const toFolderId = evt.to.dataset.folderId;

            fetch(this.urls.updateProductFolder, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({
                    'product_id': productId,
                    'folder_id': toFolderId === 'null' ? null : toFolderId
                })
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
            document.querySelectorAll('.preview-btn').forEach(button => {
                button.addEventListener('click', event => {
                    const item = event.currentTarget.closest('.grid-item');
                    const description = item.dataset.description;
                    if (description && 'speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(description);
                        utterance.rate = 0.8;
                        window.speechSynthesis.speak(utterance);
                    }
                });
            });
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
            const tabToOpen = new URLSearchParams(window.location.search).get('tab');
            const targetTab = tabToOpen === 'create' ? 'create' : 'catalog';
            const targetElement = document.querySelector(`.tab-link[data-tab='${targetTab}']`);
            this.openTab({ currentTarget: targetElement }, targetTab);
        }
    }

    new Dashboard(dashboardConfig);
});
