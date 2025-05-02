document.addEventListener('DOMContentLoaded', () => {
  // --- State ---
  let collections = [];
  let openTabs = [];
  let draggedTab = null;
  let draggedLinkInfo = null;
  let draggedCollectionId = null;
  let dragOverCollectionId = null;
  let reorderTargetInfo = null;
  let editingLinkId = null;
  let editingLinkOriginalTitle = '';
  let allCollapsed = false;
  let searchTerm = '';
  let searchTarget = 'collections';

  // --- DOM References ---
  const collectionsContainer = document.getElementById('collections-container');
  const tabsListContainer = document.getElementById('tabs-list');
  const addCollectionBtn = document.getElementById('add-collection-btn');
  const refreshTabsBtn = document.getElementById('refresh-tabs-btn');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFileInput = document.getElementById('import-file');
  const collapseAllBtn = document.getElementById('collapse-all-btn');
  const searchInput = document.getElementById('search-input');
  const searchToggleContainer = document.getElementById('search-toggle-container');

  // --- SVGs / Icons ---
  const collapseIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  const collapseAllIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>`;
  const expandAllIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>`;
  const deleteIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: auto;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const dragHandleIconSVG = `<div class="f-icon f-fill"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 4C13 4.55228 12.5523 5 12 5C11.4477 5 11 4.55228 11 4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4Z" fill="currentColor"/><path d="M13 9C13 9.55228 12.5523 10 12 10C11.4477 10 11 9.55228 11 9C11 8.44772 11.4477 8 12 8C12.5523 8 13 8.44772 13 9Z" fill="currentColor"/><path d="M13 14C13 14.5523 12.5523 15 12 15C11.4477 15 11 14.5523 11 14C11 13.4477 11.4477 13 12 13C12.5523 13 13 13.4477 13 14Z" fill="currentColor"/><path d="M13 19C13 19.5523 12.5523 20 12 20C11.4477 20 11 19.5523 11 19C11 18.4477 11.4477 18 12 18C12.5523 18 13 18.4477 13 19Z" fill="currentColor"/><path d="M8 4C8 4.55228 7.55228 5 7 5C6.44772 5 6 4.55228 6 4C6 3.44772 6.44772 3 7 3C7.55228 3 8 3.44772 8 4Z" fill="currentColor"/><path d="M8 9C8 9.55228 7.55228 10 7 10C6.44772 10 6 9.55228 6 9C6 8.44772 6.44772 8 7 8C7.55228 8 8 8.44772 8 9Z" fill="currentColor"/><path d="M8 14C8 14.5523 7.55228 15 7 15C6.44772 15 6 14.5523 6 14C6 13.4477 6.44772 13 7 13C7.55228 13 8 13.4477 8 14Z" fill="currentColor"/><path d="M8 19C8 19.5523 7.55228 20 7 20C6.44772 20 6 19.5523 6 19C6 18.4477 6.44772 18 7 18C7.55228 18 8 18.4477 8 19Z" fill="currentColor"/><path d="M18 4C18 4.55228 17.5523 5 17 5C16.4477 5 16 4.55228 16 4C16 3.44772 16.4477 3 17 3C17.5523 3 18 3.44772 18 4Z" fill="currentColor"/><path d="M18 9C18 9.55228 17.5523 10 17 10C16.4477 10 16 9.55228 16 9C16 8.44772 16.4477 8 17 8C17.5523 8 18 8.44772 18 9Z" fill="currentColor"/><path d="M18 14C18 14.5523 17.5523 15 17 15C16.4477 15 16 14.5523 16 14C16 13.4477 16.4477 13 17 13C17.5523 13 18 13.4477 18 14Z" fill="currentColor"/><path d="M18 19C18 19.5523 17.5523 20 17 20C16.4477 20 16 19.5523 16 19C16 18.4477 16.4477 18 17 18C17.5523 18 18 18.4477 18 19Z" fill="currentColor"/></svg></div>`;
  const editIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

  // --- Utility Functions ---
  const isExtensionContext = () => typeof browser !== 'undefined' && browser.runtime?.id;

  function setElementContent(element, content, isHtml = false) {
    if (!element) return;
    
    element.innerHTML = '';

    if (isHtml && typeof content === 'string') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const parsedNode = doc.body.firstChild;

        if (parsedNode) {
          element.appendChild(parsedNode);
        } else {
          console.warn('setElementContent: Failed to parse HTML string:', content);
          element.textContent = '[HTML parse error]';
        }
      } catch (e) {
        console.error('setElementContent: Error parsing HTML string:', e, content);
        element.textContent = '[HTML parse error]';
      }
    } else {
      element.textContent = content;
    }
  }

  // --- Rendering Functions ---

  /** Renders a single link block element, making it draggable */
  function createLinkElement(link, collectionId) {
    const linkBlock = document.createElement('div');
    linkBlock.className = 'link-block';
    linkBlock.dataset.collectionId = collectionId;
    linkBlock.dataset.linkId = link.id;
    linkBlock.title = `Go to: ${link.url}`;
    linkBlock.draggable = true;

    linkBlock.addEventListener('dragstart', handleLinkBlockDragStart);
    linkBlock.addEventListener('dragend', handleLinkBlockDragEnd);

    // --- Create Top Row ---
    const topRow = document.createElement('div');
    topRow.className = 'link-top-row';
    const linkFavicon = document.createElement('img');
    linkFavicon.className = 'link-favicon';
    linkFavicon.src = link.favIconUrl || './icons/placeholder-favicon.png';
    linkFavicon.alt = '';
    linkFavicon.onerror = () => {
      linkFavicon.style.display = 'none';
    };
    const titleArea = document.createElement('div');
    titleArea.className = 'link-title-area';
    const titleDisplay = document.createElement('span');
    titleDisplay.className = 'link-title-display';
    setElementContent(titleDisplay, link.title || 'Untitled Link');
    titleDisplay.title = link.title || 'Untitled Link';
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'link-title-input';
    editInput.value = link.title || '';
    editInput.placeholder = 'Link Title';
    editInput.style.display = 'none';
    editInput.dataset.linkId = link.id;
    titleArea.appendChild(titleDisplay);
    titleArea.appendChild(editInput);
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-link-btn';
    deleteBtn.title = 'Remove Link';
    setElementContent(deleteBtn, '×');
    deleteBtn.dataset.action = 'delete-link';
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-link-btn';
    editBtn.title = 'Edit title';
    setElementContent(editBtn, `<div class="f-icon">${editIconSVG}</div>`, true);
    editBtn.dataset.action = 'edit-link';
    topRow.appendChild(editBtn);
    topRow.appendChild(linkFavicon);
    topRow.appendChild(titleArea);
    topRow.appendChild(deleteBtn);

    // --- Create Bottom Row ---
    const bottomRow = document.createElement('div');
    bottomRow.className = 'link-bottom-row';
    const urlDisplay = document.createElement('span');
    urlDisplay.className = 'link-url';
    setElementContent(urlDisplay, link.url);
    urlDisplay.title = link.url;
    bottomRow.appendChild(urlDisplay);

    // --- Assemble Block ---
    linkBlock.appendChild(topRow);
    linkBlock.appendChild(bottomRow);

    return linkBlock;
  }

  /** Renders a single collection element, making its handle draggable */
  function createCollectionElement(collection, filteredLinks) {
    const collectionDiv = document.createElement('div');
    collectionDiv.className = 'collection';
    collectionDiv.dataset.collectionId = collection.id;
    if (collection.isCollapsed) collectionDiv.classList.add('collapsed');

    const header = document.createElement('div');
    header.className = 'collection-header';
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.title = 'Drag to reorder collection';
    dragHandle.draggable = true;
    setElementContent(dragHandle, dragHandleIconSVG, true);
    dragHandle.addEventListener('dragstart', handleCollectionDragStart);
    dragHandle.addEventListener('dragend', handleCollectionDragEnd);
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'collection-title-input';
    titleInput.value = collection.name;
    titleInput.placeholder = 'Collection Name';
    titleInput.dataset.action = 'edit-collection-title';
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'collection-actions';
    const collapseBtn = document.createElement('button');
    collapseBtn.classList.add('collapse-btn', 'btn', 'btn-default', 'btn-sm', 'btn-sq');
    collapseBtn.title = collection.isCollapsed ? 'Expand Collection' : 'Collapse Collection';
    collapseBtn.dataset.action = 'toggle-collapse';
    setElementContent(collapseBtn, `<div class="f-icon">${collapseIconSVG}</div>`, true);
    const deleteCollectionBtn = document.createElement('button');
    deleteCollectionBtn.classList.add('delete-collection-btn', 'btn', 'btn-danger', 'btn-sm', 'btn-sq');
    deleteCollectionBtn.title = 'Delete Collection';
    setElementContent(deleteCollectionBtn, `<div class="f-icon">${deleteIconSVG}</div>`, true);
    deleteCollectionBtn.dataset.action = 'delete-collection';
    actionsDiv.appendChild(deleteCollectionBtn);
    actionsDiv.appendChild(collapseBtn);
    header.appendChild(dragHandle);
    header.appendChild(titleInput);
    header.appendChild(actionsDiv);

    const linksGrid = document.createElement('div');
    linksGrid.className = 'links-grid';

    if (filteredLinks && filteredLinks.length > 0) {
      filteredLinks.forEach((link) => {
        linksGrid.appendChild(createLinkElement(link, collection.id));
      });
    } else {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-collection-message';
      setElementContent(emptyMsg, searchTerm ? 'No matching links found.' : 'Drag tabs here to add links.');
      linksGrid.appendChild(emptyMsg);
    }

    collectionDiv.appendChild(header);
    collectionDiv.appendChild(linksGrid);
    collectionDiv.addEventListener('dragover', handleLinkDragOver);
    collectionDiv.addEventListener('dragleave', handleLinkDragLeave);
    collectionDiv.addEventListener('drop', handleDrop);
    return collectionDiv;
  }

  /** Renders collections, applying search filter */
  function renderCollections() {
    // for debugging: console.log(`Rendering collections (filter: "${searchTerm}")...`);
    const scrollTop = collectionsContainer.scrollTop;
    collectionsContainer.innerHTML = '';

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filteredCollections = collections.filter((collection) => {
      if (!lowerSearchTerm) return true;
      const nameMatch = collection.name.toLowerCase().includes(lowerSearchTerm);
      const linkMatch = collection.links.some((link) => (link.title || '').toLowerCase().includes(lowerSearchTerm) || (link.url || '').toLowerCase().includes(lowerSearchTerm));
      return nameMatch || linkMatch;
    });

    if (filteredCollections.length === 0) {
      const emptyMsgDiv = document.createElement('div');
      emptyMsgDiv.className = 'empty-main-message';
      setElementContent(emptyMsgDiv, searchTerm ? 'No collections or links match your search.' : 'No collections yet.');
      collectionsContainer.appendChild(emptyMsgDiv);
      return;
    }

    filteredCollections.forEach((collection) => {
      const filteredLinks = !lowerSearchTerm ? collection.links : collection.links.filter((link) => (link.title || '').toLowerCase().includes(lowerSearchTerm) || (link.url || '').toLowerCase().includes(lowerSearchTerm));
      if (!lowerSearchTerm || filteredLinks.length > 0) {
        collectionsContainer.appendChild(createCollectionElement(collection, filteredLinks));
      }
    });

    collectionsContainer.scrollTop = scrollTop;
    // for debugging: console.log("Filtered collections rendered.");
  }

  /** Renders the list of open tabs, applying search filter */
  function renderTabsList() {
    // for debugging: console.log(`Rendering tabs list (filter: "${searchTerm}")...`);
    tabsListContainer.innerHTML = '';

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filteredTabs = !lowerSearchTerm ? openTabs : openTabs.filter((tab) => (tab.title || '').toLowerCase().includes(lowerSearchTerm) || (tab.url || '').toLowerCase().includes(lowerSearchTerm));

    if (filteredTabs.length === 0) {
      const emptyMsgDiv = document.createElement('div');
      emptyMsgDiv.className = 'empty-collection-message';
      setElementContent(emptyMsgDiv, searchTerm ? 'No open tabs match your search.' : 'No other open tabs found.');
      tabsListContainer.appendChild(emptyMsgDiv);
      return;
    }

    filteredTabs.forEach((tab) => {
      const tabDiv = document.createElement('div');
      tabDiv.className = 'tab-item';
      tabDiv.draggable = true;
      tabDiv.dataset.tabId = tab.id;
      tabDiv.dataset.tabUrl = tab.url;
      tabDiv.dataset.tabTitle = tab.title;
      if (tab.favIconUrl) tabDiv.dataset.tabFavicon = tab.favIconUrl;
      const favicon = document.createElement('img');
      favicon.className = 'favicon';
      favicon.src = tab.favIconUrl || './icons/placeholder-favicon.png';
      favicon.alt = '';
      favicon.onerror = () => {
        favicon.style.display = 'none';
      };
      tabDiv.appendChild(favicon);
      tabDiv.appendChild(document.createTextNode(` ${tab.title || tab.url}`));
      tabDiv.addEventListener('dragstart', handleDragStart);
      tabsListContainer.appendChild(tabDiv);
    });
    // for debugging: console.log("Filtered tabs list rendered.");
  }

  // --- Event Handlers ---
  function handleDragStart(event) {
    const tabItem = event.target.closest('.tab-item');
    if (!tabItem) return;
    draggedTab = {
      url: tabItem.dataset.tabUrl,
      title: tabItem.dataset.tabTitle,
      favIconUrl: tabItem.dataset.tabFavicon,
    };
    event.dataTransfer.setData('application/json', JSON.stringify(draggedTab));
    event.dataTransfer.effectAllowed = 'copy';
    // for debugging: console.log('Dragging tab:', draggedTab.title);
  }
  function handleLinkDragOver(event) {
    event.preventDefault();
    const collectionDiv = event.target.closest('.collection');
    if (!collectionDiv || collectionDiv.dataset.collectionId === draggedCollectionId) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    const currentCollectionId = collectionDiv.dataset.collectionId;
    const isDraggingLinkBlock = event.dataTransfer.types.includes('application/link-block+json');

    if (isDraggingLinkBlock && draggedLinkInfo?.sourceCollectionId === currentCollectionId) {
      event.dataTransfer.dropEffect = 'none';
      if (dragOverCollectionId === currentCollectionId) {
        collectionDiv.classList.remove('drag-over');
        dragOverCollectionId = null;
      }
      return;
    }

    if (dragOverCollectionId !== currentCollectionId) {
      if (dragOverCollectionId) {
        collectionsContainer.querySelector(`.collection[data-collection-id="${dragOverCollectionId}"]`)?.classList.remove('drag-over');
      }
      collectionDiv.classList.add('drag-over');
      dragOverCollectionId = currentCollectionId;
    }
    event.dataTransfer.dropEffect = isDraggingLinkBlock ? 'move' : 'copy';
  }
  function handleLinkDragLeave(event) {
    const collectionDiv = event.target.closest('.collection');
    if (collectionDiv && !collectionDiv.contains(event.relatedTarget)) {
      if (dragOverCollectionId === collectionDiv.dataset.collectionId) {
        collectionDiv.classList.remove('drag-over');
        dragOverCollectionId = null;
      }
    }
  }
  function handleDrop(event) {
    event.preventDefault();
    const collectionDiv = event.target.closest('.collection');
    if (!collectionDiv) {
      cleanupAfterDrop();
      return;
    }

    const targetCollectionId = collectionDiv.dataset.collectionId;
    const targetCollection = collections.find((c) => c.id == targetCollectionId);
    if (!targetCollection) {
      console.error('Drop target collection not found!');
      cleanupAfterDrop();
      return;
    }

    const linkBlockData = event.dataTransfer.getData('application/link-block+json');
    const newTabData = event.dataTransfer.getData('application/json');

    if (linkBlockData && draggedLinkInfo) {
      // --- Dropped an existing Link Block ---
      // for debugging: console.log(`Moving link block to collection ${targetCollectionId}`);
      const { linkId, sourceCollectionId, linkData } = draggedLinkInfo;
      if (sourceCollectionId === targetCollectionId) {
        cleanupAfterDrop();
        return;
      }
      if (targetCollection.links.some((link) => link.url === linkData.url)) {
        collectionDiv.classList.add('duplicate-attempt');
        setTimeout(() => collectionDiv.classList.remove('duplicate-attempt'), 600);
        cleanupAfterDrop();
        return;
      }
      const sourceCollection = collections.find((c) => c.id == sourceCollectionId);
      const linkIndexInSource = sourceCollection?.links.findIndex((l) => l.id == linkId);
      if (!sourceCollection || linkIndexInSource === -1) {
        console.error('Could not find source to move.');
        cleanupAfterDrop();
        return;
      }
      const [movedLink] = sourceCollection.links.splice(linkIndexInSource, 1);
      targetCollection.links.push(movedLink);
      // for debugging: console.log(`Moved link "${movedLink.title}" from ${sourceCollectionId} to ${targetCollectionId}`);
      renderCollections();
      saveData();
    } else if (newTabData && draggedTab) {
      // --- Dropped a New Tab ---
      // for debugging: console.log(`Dropping NEW TAB onto collection ID: ${targetCollectionId}`);
      if (targetCollection.links.some((link) => link.url === draggedTab.url)) {
        collectionDiv.classList.add('duplicate-attempt');
        setTimeout(() => collectionDiv.classList.remove('duplicate-attempt'), 600);
        cleanupAfterDrop();
        return;
      }
      const newLink = { id: Date.now() + Math.random(), url: draggedTab.url, title: draggedTab.title || draggedTab.url, favIconUrl: draggedTab.favIconUrl };
      targetCollection.links.push(newLink);
      renderCollections();
      saveData();
    } else {
      console.warn('Drop event occurred with unexpected data.');
    }
    cleanupAfterDrop();
  }
  function cleanupAfterDrop() {
    if (dragOverCollectionId) {
      collectionsContainer.querySelector(`.collection[data-collection-id="${dragOverCollectionId}"]`)?.classList.remove('drag-over');
    }
    draggedTab = null;
    draggedLinkInfo = null;
    dragOverCollectionId = null;
  }
  function handleLinkBlockDragStart(event) {
    const linkBlock = event.target.closest('.link-block');
    if (!linkBlock || editingLinkId?.linkId === linkBlock.dataset.linkId) {
      event.preventDefault();
      return;
    }
    const sourceCollectionId = linkBlock.dataset.collectionId;
    const linkId = linkBlock.dataset.linkId;
    const sourceCollection = collections.find((c) => c.id == sourceCollectionId);
    const linkData = sourceCollection?.links.find((l) => l.id == linkId);
    if (!linkData) {
      console.error('Could not find link data for dragged block.');
      event.preventDefault();
      return;
    }
    draggedLinkInfo = { linkId, sourceCollectionId, linkData };
    event.dataTransfer.setData('application/link-block+json', JSON.stringify(draggedLinkInfo));
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => linkBlock.classList.add('dragging'), 0);
    // for debugging: console.log(`Dragging link block: ${linkData.title} from ${sourceCollectionId}`);
  }
  function handleLinkBlockDragEnd(event) {
    const linkBlock = event.target.closest('.link-block');
    linkBlock?.classList.remove('dragging');
    draggedLinkInfo = null;
    if (dragOverCollectionId) {
      collectionsContainer.querySelector(`.collection[data-collection-id="${dragOverCollectionId}"]`)?.classList.remove('drag-over');
      dragOverCollectionId = null;
    }
    // for debugging: console.log('Link block drag end');
  }
  function handleCollectionDragStart(event) {
    const handle = event.target.closest('.drag-handle');
    if (!handle) return;
    const collectionDiv = handle.closest('.collection');
    if (!collectionDiv) return;
    if (editingLinkId) finishEditingLink(true);
    draggedCollectionId = collectionDiv.dataset.collectionId;
    event.dataTransfer.setData('text/plain', draggedCollectionId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => collectionDiv.classList.add('dragging'), 0);
    // for debugging: console.log('Dragging collection:', draggedCollectionId);
  }
  function handleCollectionDragEnd(event) {
    const draggedElement = collectionsContainer.querySelector(`.collection[data-collection-id="${draggedCollectionId}"]`);
    draggedElement?.classList.remove('dragging');
    clearReorderIndicators();
    draggedCollectionId = null;
    reorderTargetInfo = null;
    // for debugging: console.log('Collection drag end');
  }
  function handleCollectionDragOver(event) {
    event.preventDefault();
    if (!draggedCollectionId) return;
    const targetElement = event.target.closest('.collection');
    if (!targetElement || targetElement.dataset.collectionId === draggedCollectionId) {
      clearReorderIndicators();
      reorderTargetInfo = null;
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    const targetId = targetElement.dataset.collectionId;
    const rect = targetElement.getBoundingClientRect();
    const verticalMidpoint = rect.top + rect.height / 2;
    const deadZone = rect.height * 0.2;
    let hoverPosition = null;
    if (event.clientY < verticalMidpoint - deadZone / 2) hoverPosition = 'top';
    else if (event.clientY > verticalMidpoint + deadZone / 2) hoverPosition = 'bottom';
    if (hoverPosition && (!reorderTargetInfo || reorderTargetInfo.element !== targetElement || reorderTargetInfo.position !== hoverPosition)) {
      clearReorderIndicators();
      targetElement.classList.add(hoverPosition === 'top' ? 'reorder-over-top' : 'reorder-over-bottom');
      reorderTargetInfo = { element: targetElement, position: hoverPosition, targetId: targetId };
    } else if (!hoverPosition && reorderTargetInfo) {
      clearReorderIndicators();
      reorderTargetInfo = null;
    }
    event.dataTransfer.dropEffect = hoverPosition ? 'move' : 'none';
  }
  function handleCollectionDragLeaveContainer(event) {
    if (!collectionsContainer.contains(event.relatedTarget)) {
      clearReorderIndicators();
      reorderTargetInfo = null;
    }
  }
  function handleCollectionDrop(event) {
    event.preventDefault();
    clearReorderIndicators();
    if (!draggedCollectionId || !reorderTargetInfo) {
      // for debugging: console.log('Collection drop ignored: missing info.');
      draggedCollectionId = null;
      reorderTargetInfo = null;
      return;
    }
    const draggedId = draggedCollectionId;
    const targetId = reorderTargetInfo.targetId;
    const dropPosition = reorderTargetInfo.position;
    draggedCollectionId = null;
    reorderTargetInfo = null;
    // for debugging: console.log(`Dropping collection ${draggedId} ${dropPosition} of ${targetId}`);
    const draggedIndex = collections.findIndex((c) => c.id == draggedId);
    const targetIndex = collections.findIndex((c) => c.id == targetId);
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      console.error('Drop failed: Invalid indices.');
      return;
    }
    const [draggedItem] = collections.splice(draggedIndex, 1);
    const adjustedTargetIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
    const insertAtIndex = dropPosition === 'top' ? adjustedTargetIndex : adjustedTargetIndex + 1;
    collections.splice(insertAtIndex, 0, draggedItem);
    renderCollections();
    saveData();
    // for debugging: console.log('Collection reorder complete.');
  }
  function clearReorderIndicators() {
    collectionsContainer.querySelectorAll('.collection.reorder-over-top, .collection.reorder-over-bottom').forEach((el) => {
      el.classList.remove('reorder-over-top', 'reorder-over-bottom');
    });
  }
  function handleCollectionsClick(event) {
    const target = event.target;
    const action = target.dataset.action || target.closest('[data-action]')?.dataset.action;
    const linkBlock = target.closest('.link-block');
    const collectionDiv = target.closest('.collection');
    const collectionId = collectionDiv?.dataset.collectionId;
    if (!action) {
      if (linkBlock && linkBlock.contains(target) && !target.closest('button') && target.tagName !== 'INPUT') {
        const linkId = linkBlock.dataset.linkId;
        const collection = collections.find((c) => c.id == collectionId);
        const link = collection?.links.find((l) => l.id == linkId);
        if (link) navigateToLink(event, link.url);
      }
      return;
    }
    event.stopPropagation();
    if (action === 'delete-link' && linkBlock && collectionId) deleteLink(collectionId, linkBlock.dataset.linkId);
    else if (action === 'edit-link' && linkBlock && collectionId) startEditingLink(collectionId, linkBlock.dataset.linkId, linkBlock);
    else if (action === 'delete-collection' && collectionId) deleteCollectionById(collectionId);
    else if (action === 'toggle-collapse' && collectionId) toggleCollectionCollapse(collectionId);
  }
  function handleCollectionsInput(event) {
    const target = event.target;
    const action = target.dataset.action;
    if (action === 'edit-collection-title') {
      const collectionDiv = target.closest('.collection');
      const collectionId = collectionDiv?.dataset.collectionId;
      if (collectionId) updateCollectionTitle(collectionId, target.value);
    }
  }
  function handleSearchInput() {
    searchTerm = searchInput.value.trim();
    if (searchTarget === 'collections') renderCollections();
    else renderTabsList();
  }
  function handleSearchTargetChange(event) {
    if (event.target.name === 'search-target') {
      searchTarget = event.target.value;
      // for debugging: console.log('Search target changed to:', searchTarget);
      searchInput.placeholder = searchTarget === 'collections' ? 'Search Collections...' : 'Search Open Tabs...';
      searchInput.ariaLabel = searchTarget === 'collections' ? 'Search Collections' : 'Search Open Tabs';
      searchInput.value = '';
      searchTerm = '';
      if (searchTarget === 'collections') renderCollections();
      else renderTabsList();
    }
  }

  // --- Link Editing Logic ---
  function startEditingLink(collectionId, linkId, linkBlockElement) {
    if (editingLinkId) finishEditingLink(true);
    const titleDisplay = linkBlockElement.querySelector('.link-title-display');
    const editInput = linkBlockElement.querySelector('.link-title-input');
    if (!titleDisplay || !editInput) return;
    editingLinkId = { collectionId, linkId };
    editingLinkOriginalTitle = titleDisplay.textContent;
    titleDisplay.style.display = 'none';
    editInput.style.display = 'block';
    editInput.value = editingLinkOriginalTitle;
    editInput.focus();
    editInput.select();
    editInput.addEventListener('blur', handleEditBlur, { once: true });
    editInput.addEventListener('keydown', handleEditKeydown);
  }
  function finishEditingLink(save = true) {
    if (!editingLinkId) return;
    const { collectionId, linkId } = editingLinkId;
    const linkBlockElement = collectionsContainer.querySelector(`.link-block[data-link-id="${linkId}"]`);
    if (!linkBlockElement) {
      resetEditState();
      return;
    }
    const titleDisplay = linkBlockElement.querySelector('.link-title-display');
    const editInput = linkBlockElement.querySelector('.link-title-input');
    if (!titleDisplay || !editInput) {
      resetEditState();
      return;
    }
    editInput.removeEventListener('keydown', handleEditKeydown);
    let finalTitle = editingLinkOriginalTitle;
    if (save) finalTitle = editInput.value.trim() || editingLinkOriginalTitle;
    const collection = collections.find((c) => c.id == collectionId);
    const link = collection?.links.find((l) => l.id == linkId);
    let stateChanged = false;
    if (link && link.title !== finalTitle) {
      link.title = finalTitle;
      stateChanged = true;
    }
    titleDisplay.textContent = finalTitle;
    titleDisplay.style.display = 'block';
    editInput.style.display = 'none';
    const wasEditing = editingLinkId;
    resetEditState();
    if (stateChanged && wasEditing) {
      // for debugging: console.log('Link title updated, saving...');
      saveData();
    }
  }
  function handleEditBlur(event) {
    setTimeout(() => {
      if (editingLinkId && editingLinkId.linkId == event.target.dataset.linkId) {
        finishEditingLink(true);
      }
    }, 150);
  }
  function handleEditKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      finishEditingLink(true);
    } else if (event.key === 'Escape') {
      finishEditingLink(false);
    }
  }
  function resetEditState() {
    editingLinkId = null;
    editingLinkOriginalTitle = '';
  }

  // --- Action Functions ---
  function addCollection() {
    // for debugging: console.log('Adding new collection (prepending)');
    const newCollection = { id: Date.now() + Math.random(), name: `New Collection`, isCollapsed: false, links: [] };
    collections.unshift(newCollection);
    renderCollections();
    saveData();
    setTimeout(() => {
      const firstInput = collectionsContainer.querySelector('.collection:first-child .collection-title-input');
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      } else {
        console.warn('Could not find input for new collection to focus.');
      }
    }, 0);
  }
  function deleteLink(collectionId, linkId) {
    const cIndex = collections.findIndex((c) => c.id == collectionId);
    if (cIndex === -1) return;
    const lIndex = collections[cIndex].links.findIndex((l) => l.id == linkId);
    if (lIndex === -1) return;
    collections[cIndex].links.splice(lIndex, 1);
    renderCollections();
    saveData();
    // for debugging: console.log(`Deleted link ${linkId}`);
  }
  function deleteCollectionById(collectionId) {
    const index = collections.findIndex((c) => c.id == collectionId);
    if (index === -1) return;
    if (confirm(`Delete "${collections[index].name}"?`)) {
      collections.splice(index, 1);
      renderCollections();
      saveData();
      // for debugging: console.log(`Deleted collection ${collectionId}`);
    }
  }
  function updateCollectionTitle(collectionId, newName) {
    const collection = collections.find((c) => c.id == collectionId);
    const trimmedName = newName.trim();
    if (collection && collection.name !== trimmedName) {
      collection.name = trimmedName || 'Untitled Collection';
      saveData();
      // for debugging: console.log(`Updated title for collection ${collectionId}`);
      const input = collectionsContainer.querySelector(`.collection[data-collection-id="${collectionId}"] .collection-title-input`);
      if (input) input.value = collection.name;
    }
  }
  function navigateToLink(event, url) {
    if (!url || url === '#') return;
    const openInNewTab = event.ctrlKey || event.metaKey;
    if (isExtensionContext() && browser.tabs) {
      if (openInNewTab) browser.tabs.create({ url: url, active: true }).catch((e) => window.open(url, '_blank'));
      else
        browser.tabs
          .getCurrent()
          .then((t) => {
            if (!t || !t.id) throw new Error('No tab ID');
            return browser.tabs.update(t.id, { url: url });
          })
          .catch((e) => (window.location.href = url));
    } else {
      if (openInNewTab) window.open(url, '_blank');
      else window.location.href = url;
    }
  }

  // --- Collapse/Expand Logic ---
  function toggleCollectionCollapse(collectionId) {
    const collection = collections.find((c) => c.id == collectionId);
    if (!collection) return;
    collection.isCollapsed = !collection.isCollapsed;
    // for debugging: console.log(`Collection ${collectionId} collapsed state: ${collection.isCollapsed}`);
    const collectionDiv = collectionsContainer.querySelector(`.collection[data-collection-id="${collectionId}"]`);
    const collapseBtn = collectionDiv?.querySelector('.collapse-btn');
    if (collectionDiv) {
      collectionDiv.classList.toggle('collapsed', collection.isCollapsed);
      if (collapseBtn) collapseBtn.title = collection.isCollapsed ? 'Expand Collection' : 'Collapse Collection';
    }
    updateCollapseAllButtonState();
    saveData();
  }
  function toggleCollapseAll() {
    allCollapsed = !allCollapsed;
    // for debugging: console.log(`Toggling all collections to collapsed: ${allCollapsed}`);
    collections.forEach((collection) => {
      collection.isCollapsed = allCollapsed;
      const collectionDiv = collectionsContainer.querySelector(`.collection[data-collection-id="${collection.id}"]`);
      const collapseBtn = collectionDiv?.querySelector('.collapse-btn');
      if (collectionDiv) {
        collectionDiv.classList.toggle('collapsed', allCollapsed);
        if (collapseBtn) collapseBtn.title = allCollapsed ? 'Expand Collection' : 'Collapse Collection';
      }
    });
    updateCollapseAllButtonState();
    saveData();
  }
  function updateCollapseAllButtonState() {
    const currentlyAllCollapsed = collections.length > 0 && collections.every((c) => c.isCollapsed);
    allCollapsed = currentlyAllCollapsed;
    setElementContent(collapseAllBtn, `<div class="f-icon">${currentlyAllCollapsed ? expandAllIconSVG : collapseAllIconSVG}</div>`, true);
    collapseAllBtn.title = currentlyAllCollapsed ? 'Expand All Collections' : 'Collapse All Collections';
    collapseAllBtn.classList.toggle('all-collapsed', currentlyAllCollapsed);
  }

  // --- Browser API Functions ---
  async function loadData() {
    // for debugging: console.log('Loading data from storage...');
    if (!isExtensionContext() || !browser.storage) {
      console.warn('Storage API not available.');
      collections = [];
      renderCollections();
      return;
    }
    try {
      const result = await browser.storage.local.get('collections');
      collections = (result.collections || []).map((c) => ({ ...c, id: c.id || Date.now() + Math.random(), isCollapsed: c.isCollapsed || false, links: Array.isArray(c.links) ? c.links.map((l) => ({ ...l, id: l.id || Date.now() + Math.random(), favIconUrl: l.favIconUrl || null })) : [] }));
      // for debugging: console.log('Data loaded:', collections.length, 'collections');
    } catch (error) {
      console.error('Error loading data:', error);
      collections = [];
    } finally {
      renderCollections();
      updateCollapseAllButtonState();
    }
  }
  async function saveData() {
    if (!isExtensionContext() || !browser.storage) {
      console.warn('Storage API not available. Save skipped.');
      return;
    }
    const validatedCollections = collections.map((c) => ({ id: c.id || Date.now() + Math.random(), name: typeof c.name === 'string' ? c.name.trim() || 'Untitled Collection' : 'Untitled Collection', isCollapsed: c.isCollapsed || false, links: Array.isArray(c.links) ? c.links.map((l) => ({ id: l.id || Date.now() + Math.random(), url: typeof l.url === 'string' ? l.url : '#', title: typeof l.title === 'string' && l.title.trim() ? l.title.trim() : l.url || 'Untitled Link', favIconUrl: l.favIconUrl || null })) : [] }));
    try {
      await browser.storage.local.set({ collections: validatedCollections });
      // for debugging: console.log('Data saved to storage.');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
  async function fetchOpenTabs() {
    // for debugging: console.log('Fetching open tabs...');
    tabsListContainer.innerHTML = '<div class="loading-indicator">Loading tabs...</div>';
    if (!isExtensionContext() || !browser.tabs) {
      console.warn('Tabs API not available.');
      openTabs = [];
      renderTabsList();
      return;
    }
    try {
      const tabs = await browser.tabs.query({ currentWindow: true });
      openTabs = tabs.filter((tab) => tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('moz-extension:'));
      // for debugging: console.log('Tabs fetched:', openTabs.length);
    } catch (error) {
      console.error('Error fetching tabs:', error);
      openTabs = [];
    } finally {
      renderTabsList();
    }
  }
  function triggerImport() {
    importFileInput.click();
  }
  function importData(event) {
    const file = event.target.files?.[0];
    const inputElement = event.target;
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large (Max ${maxSize / 1024 / 1024}MB).`);
      if (inputElement) inputElement.value = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      let importedCollections = [];
      let isTobyFormat = false;
      try {
        const rawData = JSON.parse(e.target.result);
        if (rawData && rawData.version === 3 && Array.isArray(rawData.lists)) {
          // for debugging: console.log('Detected Toby format.');
          isTobyFormat = true;
          importedCollections = rawData.lists.map((list) => {
            if (typeof list !== 'object' || list === null || typeof list.title !== 'string' || !Array.isArray(list.cards)) throw new Error(`Invalid Toby list: ${list.title || 'Untitled'}`);
            const convertedLinks = list.cards.map((card) => {
              if (typeof card !== 'object' || card === null || typeof card.url !== 'string' || !card.url) throw new Error(`Invalid Toby card in list "${list.title}"`);
              const title = typeof card.title === 'string' && card.title.trim() ? card.title.trim() : card.url || 'Untitled Link';
              return { id: Date.now() + Math.random(), url: card.url, title: title, favIconUrl: null };
            });
            return { id: Date.now() + Math.random(), name: list.title.trim() || 'Untitled Toby Collection', isCollapsed: false, links: convertedLinks };
          });
        } else if (Array.isArray(rawData)) {
          // for debugging: console.log('Assuming native format.');
          importedCollections = rawData.map((c, index) => {
            if (typeof c !== 'object' || c === null || typeof c.name !== 'string' || !Array.isArray(c.links)) throw new Error(`Invalid native collection ${index}.`);
            const validatedLinks = c.links.map((l, linkIndex) => {
              if (typeof l !== 'object' || l === null || typeof l.url !== 'string' || !l.url) throw new Error(`Invalid native link ${linkIndex} in "${c.name}".`);
              const title = typeof l.title === 'string' && l.title.trim() ? l.title.trim() : l.url || 'Untitled Link';
              return { id: l.id || Date.now() + Math.random(), url: l.url, title: title, favIconUrl: l.favIconUrl || null };
            });
            return { id: c.id || Date.now() + Math.random(), name: c.name.trim() || `Collection ${index + 1}`, isCollapsed: c.isCollapsed || false, links: validatedLinks };
          });
        } else {
          throw new Error('Unknown import format.');
        }
        let replace = true;
        if (isTobyFormat) replace = !confirm('Toby data detected. Add these collections? (Cancel will replace all)');
        if (replace) {
          if (confirm('Replace ALL current collections?')) {
            collections = importedCollections;
            alert('Import successful! Collections replaced.');
          } else {
            // for debugging: console.log('Import (replace) cancelled.');
            return;
          }
        } else {
          collections = collections.concat(importedCollections);
          alert(`Import successful! ${importedCollections.length} collections added.`);
        }
        renderCollections();
        saveData();
        updateCollapseAllButtonState();
      } catch (error) {
        console.error('Import error:', error);
        alert(`Import failed: ${error.message}`);
      } finally {
        if (inputElement) inputElement.value = null;
      }
    };
    reader.onerror = (e) => {
      console.error('File read error:', e);
      alert('Failed to read file.');
      if (inputElement) inputElement.value = null;
    };
    reader.readAsText(file);
  }
  function exportData() {
    try {
      const dataStr = JSON.stringify(collections, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      if (!isExtensionContext() || !browser.downloads) {
        console.warn('Downloads API not available, using fallback.');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-tab-blocks-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      browser.downloads
        .download({ url: url, filename: 'my-tab-blocks-config.json', saveAs: true })
        .then((id) => URL.revokeObjectURL(url))
        .catch((err) => {
          console.error('Download failed:', err);
          URL.revokeObjectURL(url);
        });
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export.');
    }
  }

  // --- Initialization ---
  addCollectionBtn.addEventListener('click', addCollection);
  refreshTabsBtn.addEventListener('click', fetchOpenTabs);
  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', triggerImport);
  importFileInput.addEventListener('change', importData);
  collectionsContainer.addEventListener('click', handleCollectionsClick);
  collectionsContainer.addEventListener('change', handleCollectionsInput);
  collectionsContainer.addEventListener('dragover', handleCollectionDragOver);
  collectionsContainer.addEventListener('dragleave', handleCollectionDragLeaveContainer);
  collectionsContainer.addEventListener('drop', handleCollectionDrop);
  collapseAllBtn.addEventListener('click', toggleCollapseAll);
  searchInput.addEventListener('input', handleSearchInput);
  searchToggleContainer.addEventListener('change', handleSearchTargetChange);

  loadData();
  fetchOpenTabs();
  if (isExtensionContext()) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.collections) {
        // for debugging: console.log('Storage changed externally, reloading...');
        loadData();
      }
    });
  }
});