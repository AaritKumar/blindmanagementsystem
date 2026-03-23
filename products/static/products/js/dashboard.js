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
            this.initFolderCreation();
            this.initFormValidation();
            this.initTemplateSearch();
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
                this.initSingleDragAndDrop(grid);
            });
        }

        initSingleDragAndDrop(grid) {
            new Sortable(grid, { group: 'shared', animation: 150, onEnd: (evt) => this.handleDrop(evt) });
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
                this.initSingleFolderToggle(header);
            });
        }

        initSingleFolderToggle(header) {
            header.addEventListener('click', (event) => {
                if (!event.target.closest('.folder-actions')) {
                    const isOpen = header.classList.toggle('open');
                    header.setAttribute('aria-expanded', isOpen);
                    const content = header.nextElementSibling;
                    content.style.maxHeight = content.style.maxHeight ? null : `${content.scrollHeight}px`;
                }
            });
        }
        
        handleUrlParams() {
            const tabToOpen = new URLSearchParams(window.location.search).get('tab') || 'catalog';
            this.openTab(tabToOpen);
        }

        initTemplateCreation() {
            const form = document.getElementById('template-creation-form');
            if (!form) return;

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(form);
                
                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-CSRFToken': this.csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'ok') {
                        const templateList = document.getElementById('template-list');
                        const newLi = document.createElement('li');
                        const newLink = document.createElement('a');
                        newLink.href = data.url;
                        newLink.textContent = data.name;
                        newLi.appendChild(newLink);
                        
                        const noResults = templateList.querySelector('.no-results');
                        if(noResults) {
                            templateList.insertBefore(newLi, noResults);
                        } else {
                            templateList.appendChild(newLi);
                        }
                        
                        form.reset();
                        document.getElementById('template-modal').style.display = 'none';
                        // After adding a new template, re-init the search list
                        this.initTemplateSearch();
                    } else {
                        alert('Error creating template: ' + (data.message || 'Unknown error'));
                    }
                });
            });
        }

        initFolderCreation() {
            const form = document.getElementById('folder-creation-form');
            if (!form) return;

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(form);
                
                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 
                        'X-CSRFToken': this.csrfToken,
                        'X-Requested-With': 'XMLHttpRequest' 
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'ok') {
                        this.addNewFolderToDOM(data.folder);
                        form.reset();
                        document.getElementById('folder-modal').style.display = 'none';
                    } else {
                        alert('Error creating folder.');
                    }
                });
            });
        }

        addNewFolderToDOM(folder) {
            const folderContainer = document.querySelector('#catalog'); // A bit simplistic, might need a more specific container
            const newFolderSection = document.createElement('div');
            newFolderSection.className = 'folder-section';
            newFolderSection.innerHTML = `
                <h3 class="folder-header" data-folder-id="${folder.pk}" aria-expanded="false" aria-controls="folder-content-${folder.pk}">
                    <span>
                        <svg class="folder-toggle-icon" viewBox="0 0 24 24"><path class="folder-closed" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path class="folder-open" d="M19 13H5v-2h14v2z"/></svg>
                        <svg class="folder-icon" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>
                        ${folder.name}
                    </span>
                    <div class="folder-actions">
                        <a href="${folder.edit_url}" class="btn-icon" title="Edit Folder">
                            <svg class="icon-edit" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                            <span class="sr-only">Edit Folder</span>
                        </a>
                        <form method="post" action="${folder.delete_url}" style="display:inline;">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${this.csrfToken}">
                            <button type="submit" class="btn-icon" title="Delete Folder" onclick="return confirm('Are you sure you want to delete this folder? All products inside will be moved to Uncategorized.');">
                                <svg class="icon-delete" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                                <span class="sr-only">Delete Folder</span>
                            </button>
                        </form>
                    </div>
                </h3>
                <div class="folder-content" id="folder-content-${folder.pk}">
                    <div class="grid-container folder-grid" id="folder-${folder.pk}" data-folder-id="${folder.pk}">
                        <!-- New products for this folder can be dropped here -->
                    </div>
                </div>
            `;
            
            // Find the uncategorized section to insert before it
            const uncategorizedSection = Array.from(document.querySelectorAll('.folder-section h3')).find(h3 => h3.textContent.trim() === 'Uncategorized');
            if (uncategorizedSection) {
                folderContainer.insertBefore(newFolderSection, uncategorizedSection.parentElement);
            } else {
                folderContainer.appendChild(newFolderSection);
            }

            // Re-initialize toggles and drag-and-drop for the new folder
            this.initSingleFolderToggle(newFolderSection.querySelector('.folder-header'));
            this.initSingleDragAndDrop(newFolderSection.querySelector('.grid-container'));
        }

        initFormValidation() {
            const productForm = document.querySelector('#product-creation-form');
            if (!productForm) return;

            productForm.setAttribute('novalidate', true);

            productForm.addEventListener('submit', (event) => {
                const name = document.getElementById('id_name');
                const description = document.getElementById('id_text_description');
                let isValid = true;

                if (name.value.trim() === '') {
                    this.showError(name, 'Product name is required.');
                    isValid = false;
                } else {
                    this.showError(name, null);
                }

                if (description.value.trim() === '') {
                    this.showError(description, 'Text description is required.');
                    isValid = false;
                } else {
                    this.showError(description, null);
                }

                if (!isValid) {
                    event.preventDefault();
                }
            });
        }

        showError(field, message) {
            let error = field.parentElement.querySelector('.error-message');
            if (!error) {
                error = document.createElement('div');
                error.className = 'error-message';
                field.parentElement.appendChild(error);
            }
            error.textContent = message;
            error.style.display = message ? 'block' : 'none';
        }

        initTemplateSearch() {
            const searchInput = document.getElementById('template-search');
            const templateList = document.getElementById('template-list');
            if (!searchInput || !templateList) return;

            const listItems = Array.from(templateList.getElementsByTagName('li'));

            let noResultsMessage = templateList.querySelector('.no-results');
            if (!noResultsMessage) {
                noResultsMessage = document.createElement('li');
                noResultsMessage.className = 'no-results';
                noResultsMessage.textContent = 'No templates found.';
                noResultsMessage.style.display = 'none';
                templateList.appendChild(noResultsMessage);
            }

            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                let visibleCount = 0;

                listItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    const isVisible = text.includes(searchTerm);
                    item.style.display = isVisible ? '' : 'none';
                    if (isVisible) {
                        visibleCount++;
                    }
                });

                noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
            });
        }



    }

    new Dashboard(dashboardConfig);
});
