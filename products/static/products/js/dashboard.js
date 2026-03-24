document.addEventListener('DOMContentLoaded', function () {
    // Handles dashboard interactions
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
            this.initProductCreation();
        }

        initTabs() {
            const tabs = document.querySelectorAll('.tab-link');
            tabs.forEach((tab) => {
                tab.addEventListener('click', (event) => {
                    this.openTab(event.currentTarget.dataset.tab);
                });
            });
        }

        openTab(tabName) {
            document.querySelectorAll('.tab-content').forEach((content) => {
                content.classList.remove('active');
            });

            document.querySelectorAll('.tab-link').forEach((tab) => {
                tab.classList.remove('active');
            });

            document.getElementById(tabName).classList.add('active');
            document.querySelector(`.tab-link[data-tab='${tabName}']`).classList.add('active');
        }

        initCreateTabs() {
            const tabs = document.querySelectorAll('.create-tab-link');
            tabs.forEach((tab) => {
                tab.addEventListener('click', (event) => {
                    this.openCreateTab(event.currentTarget.dataset.tab);
                });
            });
        }

        openCreateTab(tabName) {
            document.querySelectorAll('.create-tab-content').forEach((content) => {
                content.classList.remove('active');
            });

            document.querySelectorAll('.create-tab-link').forEach((tab) => {
                tab.classList.remove('active');
            });

            document.getElementById(tabName).classList.add('active');
            document.querySelector(`.create-tab-link[data-tab='${tabName}']`).classList.add('active');
        }

        // Open and close modals
        initModals() {
            const folderModal = document.getElementById('folder-modal');
            const templateModal = document.getElementById('template-modal');

            document.getElementById('fab').onclick = function () {
                folderModal.style.display = 'flex';
            };

            folderModal.querySelector('.close-button').onclick = function () {
                folderModal.style.display = 'none';
            };

            folderModal.onclick = function (event) {
                if (event.target === folderModal) {
                    folderModal.style.display = 'none';
                }
            };

            document.getElementById('show-template-modal-btn').onclick = function () {
                templateModal.style.display = 'flex';
            };

            templateModal.querySelector('.close-button').onclick = function () {
                templateModal.style.display = 'none';
            };

            templateModal.onclick = function (event) {
                if (event.target === templateModal) {
                    templateModal.style.display = 'none';
                }
            };
        }

        // Drag cards between folders
        initDragAndDrop() {
            document.querySelectorAll('.grid-container').forEach((grid) => {
                this.initSingleDragAndDrop(grid);
            });
        }

        initSingleDragAndDrop(grid) {
            new Sortable(grid, {
                group: 'shared',
                animation: 150,
                onEnd: (evt) => this.handleDrop(evt),
            });
        }

        handleDrop(evt) {
            const productId = evt.item.dataset.id;
            const toFolderId = evt.to.dataset.folderId;

            fetch(this.urls.updateProductFolder, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken,
                },
                body: JSON.stringify({
                    product_id: productId,
                    folder_id: toFolderId === 'null' ? null : toFolderId,
                }),
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

        // Play text-to-speech previews
        initPreviewButtons() {
            document.getElementById('custom-preview-btn').addEventListener('click', () => {
                const text = document.getElementById('id_text_description').value;
                this.speak(text);
            });

            document.querySelectorAll('.preview-btn').forEach((button) => {
                button.addEventListener('click', (event) => {
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

        // Expand and collapse folders
        initFolderToggles() {
            document.querySelectorAll('.folder-header').forEach((header) => {
                this.initSingleFolderToggle(header);
            });
        }

        initSingleFolderToggle(header) {
            header.addEventListener('click', function (event) {
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

        // Create template in place
        initTemplateCreation() {
            const form = document.getElementById('template-creation-form');
            if (!form) return;

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(form);

                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': this.csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.status === 'ok') {
                            const list = document.getElementById('template-list');
                            const li = document.createElement('li');
                            const a = document.createElement('a');

                            a.href = data.url;
                            a.textContent = data.name;
                            li.appendChild(a);

                            const noResults = list.querySelector('.no-results');
                            if (noResults) {
                                list.insertBefore(li, noResults);
                            } else {
                                list.appendChild(li);
                            }

                            form.reset();
                            document.getElementById('template-modal').style.display = 'none';
                            this.initTemplateSearch();
                        } else {
                            alert('Could not create template: ' + (data.message || 'please try again'));
                        }
                    });
            });
        }

        // Create folder in place
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
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.status === 'ok') {
                            this.addNewFolderToDOM(data.folder);
                            form.reset();
                            document.getElementById('folder-modal').style.display = 'none';
                        } else {
                            alert('Could not create folder.');
                        }
                    });
            });
        }

        addNewFolderToDOM(folder) {
            const catalog = document.querySelector('#catalog');
            const section = document.createElement('div');
            section.className = 'folder-section';

            section.innerHTML = `
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
                        <form method="post" action="${folder.delete_url}" class="inline-form">
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
                        <!-- cards dropped here -->
                    </div>
                </div>
            `;

            const uncategorized = Array.from(document.querySelectorAll('.folder-section h3')).find((h3) => {
                return h3.textContent.trim() === 'Uncategorized';
            });

            if (uncategorized) {
                catalog.insertBefore(section, uncategorized.parentElement);
            } else {
                catalog.appendChild(section);
            }

            this.initSingleFolderToggle(section.querySelector('.folder-header'));
            this.initSingleDragAndDrop(section.querySelector('.grid-container'));
        }

        // Form validation
        initFormValidation() {
            const productForm = document.querySelector('#product-creation-form');
            if (!productForm) return;

            productForm.setAttribute('novalidate', true);

            const nameInput = document.getElementById('id_name');
            const descInput = document.getElementById('id_text_description');

            this.updateCharCounter(nameInput, 200);
            this.updateCharCounter(descInput, 1000);

            nameInput.addEventListener('input', () => this.updateCharCounter(nameInput, 200));
            descInput.addEventListener('input', () => this.updateCharCounter(descInput, 1000));

            productForm.addEventListener('submit', (event) => {
                let ok = true;

                if (nameInput.value.trim() === '') {
                    this.showError(nameInput, 'Product name is required.');
                    ok = false;
                } else {
                    this.showError(nameInput, null);
                }

                if (descInput.value.trim() === '') {
                    this.showError(descInput, 'Text description is required.');
                    ok = false;
                } else {
                    this.showError(descInput, null);
                }

                if (!ok) {
                    event.preventDefault();
                }
            });
        }

        updateCharCounter(field, maxLength) {
            const counter = field.parentElement.querySelector('.char-counter');
            if (!counter) return;

            counter.textContent = `${field.value.length} / ${maxLength}`;
            if (field.value.length > maxLength) {
                counter.style.color = '#ee6c4d';
            } else {
                counter.style.color = '';
            }
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

        // Filter template list
        initTemplateSearch() {
            const searchInput = document.getElementById('template-search');
            const templateList = document.getElementById('template-list');
            if (!searchInput || !templateList) return;

            const listItems = Array.from(templateList.getElementsByTagName('li'));

            let noResults = templateList.querySelector('.no-results');
            if (!noResults) {
                noResults = document.createElement('li');
                noResults.className = 'no-results';
                noResults.textContent = 'No templates found.';
                noResults.style.display = 'none';
                templateList.appendChild(noResults);
            }

            searchInput.oninput = () => {
                const searchTerm = searchInput.value.toLowerCase();
                let visibleCount = 0;

                listItems.forEach((item) => {
                    const text = item.textContent.toLowerCase();
                    const show = text.includes(searchTerm);
                    item.style.display = show ? '' : 'none';
                    if (show) visibleCount += 1;
                });

                noResults.style.display = visibleCount === 0 ? 'block' : 'none';
            };
        }

        // Create product in place
        initProductCreation() {
            const form = document.getElementById('product-creation-form');
            if (!form) return;

            form.addEventListener('submit', (event) => {
                event.preventDefault();

                const nameInput = document.getElementById('id_name');
                const descInput = document.getElementById('id_text_description');
                let ok = true;

                if (nameInput.value.trim() === '') {
                    this.showError(nameInput, 'Product name is required.');
                    ok = false;
                }

                if (descInput.value.trim() === '') {
                    this.showError(descInput, 'Text description is required.');
                    ok = false;
                }

                if (!ok) return;

                const formData = new FormData(form);

                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': this.csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.status === 'ok') {
                            this.addNewProductToDOM(data.product);
                            form.reset();
                            this.openTab('catalog');
                        } else {
                            alert('Could not create product.');
                        }
                    });
            });
        }

        addNewProductToDOM(product) {
            const uncategorizedGrid = document.getElementById('uncategorized-grid');
            const card = document.createElement('div');
            card.className = 'grid-item';
            card.dataset.id = product.pk;
            card.dataset.description = product.text_description;

            card.innerHTML = `
                <p><strong>${product.name}</strong></p>
                <img src="${product.image_data}" alt="QR Code for ${product.name}" width="100">
                <div class="item-actions">
                    <button class="btn-icon preview-btn" title="Play Audio Preview">
                        <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                        <span class="sr-only">Play Audio Preview</span>
                    </button>
                    <a href="${product.edit_url}" class="btn-icon" title="Edit">
                        <svg class="icon-edit" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                        <span class="sr-only">Edit</span>
                    </a>
                    <a href="${product.image_data}" download="${product.filename}" class="btn-icon" title="Download">
                        <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>
                        <span class="sr-only">Download QR Code</span>
                    </a>
                    <form method="post" action="${product.delete_url}" class="inline-form">
                        <input type="hidden" name="csrfmiddlewaretoken" value="${this.csrfToken}">
                        <button type="submit" class="btn-icon" title="Delete" onclick="return confirm('Are you sure?');">
                            <svg class="icon-delete" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                            <span class="sr-only">Delete</span>
                        </button>
                    </form>
                </div>
            `;

            uncategorizedGrid.appendChild(card);

            card.querySelector('.preview-btn').addEventListener('click', (event) => {
                const description = event.currentTarget.closest('.grid-item').dataset.description;
                this.speak(description);
            });
        }
    }

    new Dashboard(dashboardConfig);
});
