document.addEventListener('DOMContentLoaded', () => {
  // --- Platform ---
  const isMobile = window.matchMedia('(pointer: coarse)').matches;

  // --- State ---
  let collections = [];
  let openTabs = [];
  let draggedTab = null;
  let draggedLinkInfo = null;
  let draggedSplitPair = null;
  let draggedCollectionId = null;
  let dragOverCollectionId = null;
  let reorderTargetInfo = null;
  let reorderLinkTargetInfo = null;
  let editingLinkId = null;
  let editingLinkOriginalTitle = '';
  let allCollapsed = false;
  let pendingSaveCount = 0;
  let searchTerm = '';
  let searchTarget = 'collections';
  const pendingEnterAnimations = new Map(); // id → delay ms
  let mobileTargetCollectionId = null;
  let mobileEditingCollectionId = null;
  let mobileEditingLinkId = null;

  // --- DOM References ---
  const collectionsContainer = document.getElementById('collections-container');
  const tabsListContainer = document.getElementById('tabs-list');
  const addCollectionBtn = document.getElementById('add-collection-btn');
  const refreshTabsBtn = document.getElementById('refresh-tabs-btn');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFileInput = document.getElementById('import-file-input');
  const collapseAllBtn = document.getElementById('collapse-all-btn');
  const searchInput = document.getElementById('search-input');
  const searchToggleContainer = document.getElementById('search-toggle-container');
  const mobileTabSheet = document.getElementById('mobile-tab-sheet');
  const mobileCollectionModal = document.getElementById('mobile-collection-modal');
  const mobileLinkModal = document.getElementById('mobile-link-modal');

  // --- SVGs / Icons ---
  const collapseIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  const collapseAllIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>`;
  const expandAllIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>`;
  const deleteIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: auto;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const dragHandleIconSVG = `<div class="f-icon f-fill"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 4C13 4.55228 12.5523 5 12 5C11.4477 5 11 4.55228 11 4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4Z" fill="currentColor"/><path d="M13 9C13 9.55228 12.5523 10 12 10C11.4477 10 11 9.55228 11 9C11 8.44772 11.4477 8 12 8C12.5523 8 13 8.44772 13 9Z" fill="currentColor"/><path d="M13 14C13 14.5523 12.5523 15 12 15C11.4477 15 11 14.5523 11 14C11 13.4477 11.4477 13 12 13C12.5523 13 13 13.4477 13 14Z" fill="currentColor"/><path d="M13 19C13 19.5523 12.5523 20 12 20C11.4477 20 11 19.5523 11 19C11 18.4477 11.4477 18 12 18C12.5523 18 13 18.4477 13 19Z" fill="currentColor"/><path d="M8 4C8 4.55228 7.55228 5 7 5C6.44772 5 6 4.55228 6 4C6 3.44772 6.44772 3 7 3C7.55228 3 8 3.44772 8 4Z" fill="currentColor"/><path d="M8 9C8 9.55228 7.55228 10 7 10C6.44772 10 6 9.55228 6 9C6 8.44772 6.44772 8 7 8C7.55228 8 8 8.44772 8 9Z" fill="currentColor"/><path d="M8 14C8 14.5523 7.55228 15 7 15C6.44772 15 6 14.5523 6 14C6 13.4477 6.44772 13 7 13C7.55228 13 8 13.4477 8 14Z" fill="currentColor"/><path d="M8 19C8 19.5523 7.55228 20 7 20C6.44772 20 6 19.5523 6 19C6 18.4477 6.44772 18 7 18C7.55228 18 8 18.4477 8 19Z" fill="currentColor"/><path d="M18 4C18 4.55228 17.5523 5 17 5C16.4477 5 16 4.55228 16 4C16 3.44772 16.4477 3 17 3C17.5523 3 18 3.44772 18 4Z" fill="currentColor"/><path d="M18 9C18 9.55228 17.5523 10 17 10C16.4477 10 16 9.55228 16 9C16 8.44772 16.4477 8 17 8C17.5523 8 18 8.44772 18 9Z" fill="currentColor"/><path d="M18 14C18 14.5523 17.5523 15 17 15C16.4477 15 16 14.5523 16 14C16 13.4477 16.4477 13 17 13C17.5523 13 18 13.4477 18 14Z" fill="currentColor"/><path d="M18 19C18 19.5523 17.5523 20 17 20C16.4477 20 16 19.5523 16 19C16 18.4477 16.4477 18 17 18C17.5523 18 18 18.4477 18 19Z" fill="currentColor"/></svg></div>`;
  const editIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
  const plusIconSVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  const splitViewIconSVG = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="5" height="12" rx="1"/><rect x="8" y="1" width="5" height="12" rx="1"/></svg>`;

  // --- Utility Functions ---
  const isExtensionContext = () => typeof browser !== 'undefined' && browser.runtime?.id;
  const isSafeUrl = (url) => { try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; } };

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
    if (!isMobile) {
      linkBlock.draggable = true;
      linkBlock.addEventListener('dragstart', handleLinkBlockDragStart);
      linkBlock.addEventListener('dragend', handleLinkBlockDragEnd);
    } else {
      addLongPressHandler(linkBlock, () => openLinkModal(collectionId, link.id));
    }

    // --- Create Top Row ---
    const topRow = document.createElement('div');
    topRow.className = 'link-top-row';
    const linkFavicon = document.createElement('img');
    linkFavicon.className = 'link-favicon';
    if (link.favIconUrl) {
      linkFavicon.src = link.favIconUrl;
    } else {
      try {
        const host = new URL(link.url).hostname;
        linkFavicon.src = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
      } catch {
        linkFavicon.src = './icons/placeholder-favicon.png';
      }
    }
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

    if (pendingEnterAnimations.has(link.id)) {
      const delay = pendingEnterAnimations.get(link.id);
      if (delay) linkBlock.style.animationDelay = `${delay}ms, ${delay + 665}ms`;
      linkBlock.classList.add('link-block--entering');
      pendingEnterAnimations.delete(link.id);
    }

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
    if (!isMobile) titleInput.dataset.action = 'edit-collection-title';
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'collection-actions';
    const collapseBtn = document.createElement('button');
    collapseBtn.classList.add('collapse-btn', 'btn', 'btn-default', 'btn-sm', 'btn-sq');
    collapseBtn.title = collection.isCollapsed ? 'Expand Collection' : 'Collapse Collection';
    collapseBtn.dataset.action = 'toggle-collapse';
    setElementContent(collapseBtn, `<div class="f-icon">${collapseIconSVG}</div>`, true);
    if (isMobile) {
      const editCollectionBtn = document.createElement('button');
      editCollectionBtn.classList.add('btn', 'btn-default', 'btn-sm', 'btn-sq');
      editCollectionBtn.title = 'Edit Collection';
      setElementContent(editCollectionBtn, `<div class="f-icon">${editIconSVG}</div>`, true);
      editCollectionBtn.addEventListener('click', () => openCollectionModal(collection.id));
      actionsDiv.appendChild(editCollectionBtn);
    } else {
      const deleteCollectionBtn = document.createElement('button');
      deleteCollectionBtn.classList.add('delete-collection-btn', 'btn', 'btn-danger', 'btn-sm', 'btn-sq');
      deleteCollectionBtn.title = 'Delete Collection';
      setElementContent(deleteCollectionBtn, `<div class="f-icon">${deleteIconSVG}</div>`, true);
      deleteCollectionBtn.dataset.action = 'delete-collection';
      actionsDiv.appendChild(deleteCollectionBtn);
    }
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
    } else if (!isMobile) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-collection-message';
      setElementContent(emptyMsg, searchTerm ? 'No matching links found.' : 'Drag tabs here to add links.');
      linksGrid.appendChild(emptyMsg);
    }

    if (isMobile) {
      linksGrid.appendChild(createAddLinkBlock(collection.id));
    }

    collectionDiv.appendChild(header);
    collectionDiv.appendChild(linksGrid);
    if (!isMobile) {
      collectionDiv.addEventListener('dragover', handleLinkDragOver);
      collectionDiv.addEventListener('dragleave', handleLinkDragLeave);
      collectionDiv.addEventListener('drop', handleDrop);
    }
    return collectionDiv;
  }

  /** Renders collections, applying search filter */
  function renderCollections() {
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
  }

  /** Creates a single tab row element */
  function createTabElement(tab) {
    const tabDiv = document.createElement('div');
    tabDiv.className = 'tab-item';
    tabDiv.draggable = true;
    tabDiv.dataset.tabId = tab.id;
    tabDiv.dataset.tabUrl = tab.url;
    tabDiv.dataset.tabTitle = tab.title;
    if (tab.favIconUrl) tabDiv.dataset.tabFavicon = tab.favIconUrl;
    tabDiv.title = tab.title || tab.url;
    if (tab.containerColor) {
      tabDiv.style.setProperty('--container-color', tab.containerColor);
      tabDiv.classList.add('has-container');
      tabDiv.title = `[${tab.containerName}] ${tab.title || tab.url}`;
    }
    const favicon = document.createElement('img');
    favicon.className = 'favicon';
    favicon.src = tab.favIconUrl || './icons/placeholder-favicon.png';
    favicon.alt = '';
    favicon.onerror = () => { favicon.style.display = 'none'; };
    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title';
    titleSpan.textContent = tab.title || tab.url;
    tabDiv.appendChild(favicon);
    tabDiv.appendChild(titleSpan);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-tab-btn';
    closeBtn.title = 'Close tab';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (isExtensionContext() && browser.tabs) {
        try {
          await browser.tabs.remove(tab.id);
          fetchOpenTabs();
        } catch (err) {
          console.error('Failed to close tab:', err);
        }
      }
    });
    tabDiv.appendChild(closeBtn);
    tabDiv.addEventListener('dragstart', handleDragStart);
    return tabDiv;
  }

  /** Renders the list of open tabs, grouping split pairs with a draggable wire handle */
  function renderTabsList() {
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

    const splitGroupCounts = {};
    filteredTabs.forEach((tab) => {
      if (tab.splitViewId != null && tab.splitViewId !== -1)
        splitGroupCounts[tab.splitViewId] = (splitGroupCounts[tab.splitViewId] || 0) + 1;
    });

    const seen = new Set();
    let rowIndex = 0;
    const staggerRow = (el) => {
      el.classList.add('tabs-row--entering');
      el.style.animationDelay = `${rowIndex++ * 45}ms`;
    };

    filteredTabs.forEach((tab) => {
      if (seen.has(tab.id)) return;
      seen.add(tab.id);

      const isSplit = tab.splitViewId != null && tab.splitViewId !== -1 && (splitGroupCounts[tab.splitViewId] || 0) > 1;
      if (isSplit) {
        const partner = filteredTabs.find((t) => !seen.has(t.id) && t.splitViewId === tab.splitViewId);
        if (partner) {
          seen.add(partner.id);
          const pairDiv = document.createElement('div');
          pairDiv.className = 'split-pair';
          const wire = document.createElement('div');
          wire.className = 'split-pair-wire';
          wire.draggable = true;
          wire.title = 'Drag to add both tabs to a collection';
          const wireTop = document.createElement('div');
          wireTop.className = 'wire-line';
          const wireIcon = document.createElement('div');
          wireIcon.className = 'wire-icon';
          wireIcon.innerHTML = splitViewIconSVG;
          const wireBottom = document.createElement('div');
          wireBottom.className = 'wire-line';
          wire.appendChild(wireTop);
          wire.appendChild(wireIcon);
          wire.appendChild(wireBottom);
          wire.addEventListener('dragstart', (e) => handleSplitPairDragStart(e, [tab, partner]));
          wire.addEventListener('dragend', handleSplitPairDragEnd);
          const tabsCol = document.createElement('div');
          tabsCol.className = 'split-pair-tabs';
          tabsCol.appendChild(createTabElement(tab));
          tabsCol.appendChild(createTabElement(partner));
          pairDiv.appendChild(wire);
          pairDiv.appendChild(tabsCol);
          staggerRow(pairDiv);
          tabsListContainer.appendChild(pairDiv);
          return;
        }
      }
      const tabEl = createTabElement(tab);
      staggerRow(tabEl);
      tabsListContainer.appendChild(tabEl);
    });
  }

  // --- Event Handlers ---
  function handleSplitPairDragStart(event, tabs) {
    draggedSplitPair = tabs.map((t) => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl }));
    event.dataTransfer.setData('application/split-pair+json', JSON.stringify(draggedSplitPair));
    event.dataTransfer.effectAllowed = 'copy';
  }
  function handleSplitPairDragEnd() {
    draggedSplitPair = null;
  }
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
      event.dataTransfer.dropEffect = 'move';
      if (dragOverCollectionId === currentCollectionId) {
        collectionDiv.classList.remove('drag-over');
        dragOverCollectionId = null;
      }
      const targetLinkBlock = event.target.closest('.link-block');
      if (targetLinkBlock && targetLinkBlock.dataset.linkId != draggedLinkInfo.linkId) {
        const rect = targetLinkBlock.getBoundingClientRect();
        const position = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
        if (!reorderLinkTargetInfo || reorderLinkTargetInfo.element !== targetLinkBlock || reorderLinkTargetInfo.position !== position) {
          clearLinkReorderIndicators();
          targetLinkBlock.classList.add(position === 'before' ? 'reorder-link-before' : 'reorder-link-after');
          reorderLinkTargetInfo = { element: targetLinkBlock, position, linkId: targetLinkBlock.dataset.linkId, collectionId: currentCollectionId };
        }
      } else {
        clearLinkReorderIndicators();
        reorderLinkTargetInfo = null;
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
      if (reorderLinkTargetInfo?.collectionId === collectionDiv.dataset.collectionId) {
        clearLinkReorderIndicators();
        reorderLinkTargetInfo = null;
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
    const splitPairData = event.dataTransfer.getData('application/split-pair+json');

    if (splitPairData && draggedSplitPair) {
      let added = 0;
      for (const tabData of draggedSplitPair) {
        if (!targetCollection.links.some((l) => l.url === tabData.url)) {
          const newId = crypto.randomUUID();
          pendingEnterAnimations.set(newId, added * 90);
          targetCollection.links.push({ id: newId, url: tabData.url, title: tabData.title || tabData.url, favIconUrl: tabData.favIconUrl || null });
          added++;
        }
      }
      if (added > 0) { resetSearch(); renderCollections(); renderTabsList(); saveData(); }
    } else if (linkBlockData && draggedLinkInfo) {
      // --- Dropped an existing Link Block ---
      const { linkId, sourceCollectionId, linkData } = draggedLinkInfo;
      if (sourceCollectionId === targetCollectionId) {
        if (reorderLinkTargetInfo) {
          const targetLinkId = reorderLinkTargetInfo.linkId;
          const position = reorderLinkTargetInfo.position;
          const collection = collections.find((c) => c.id == targetCollectionId);
          const draggedIndex = collection?.links.findIndex((l) => l.id == linkId);
          const targetIndex = collection?.links.findIndex((l) => l.id == targetLinkId);
          if (collection && draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
            const [movedLink] = collection.links.splice(draggedIndex, 1);
            const adjustedTarget = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
            collection.links.splice(position === 'before' ? adjustedTarget : adjustedTarget + 1, 0, movedLink);
            renderCollections();
            saveData();
          }
        }
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
      pendingEnterAnimations.set(movedLink.id, 0);
      targetCollection.links.push(movedLink);
      renderCollections();
      saveData();
    } else if (newTabData && draggedTab) {
      // --- Dropped a New Tab ---
      if (targetCollection.links.some((link) => link.url === draggedTab.url)) {
        collectionDiv.classList.add('duplicate-attempt');
        setTimeout(() => collectionDiv.classList.remove('duplicate-attempt'), 600);
        cleanupAfterDrop();
        return;
      }
      const newLink = { id: crypto.randomUUID(), url: draggedTab.url, title: draggedTab.title || draggedTab.url, favIconUrl: draggedTab.favIconUrl };
      pendingEnterAnimations.set(newLink.id, 0);
      targetCollection.links.push(newLink);
      resetSearch();
      renderCollections();
      renderTabsList();
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
    clearLinkReorderIndicators();
    draggedTab = null;
    draggedLinkInfo = null;
    draggedSplitPair = null;
    dragOverCollectionId = null;
    reorderLinkTargetInfo = null;
  }
  function handleLinkBlockDragStart(event) {
    const linkBlock = event.target.closest('.link-block');
    if (!linkBlock || editingLinkId?.linkId == linkBlock.dataset.linkId) {
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
  }
  function handleLinkBlockDragEnd(event) {
    const linkBlock = event.target.closest('.link-block');
    linkBlock?.classList.remove('dragging');
    draggedLinkInfo = null;
    clearLinkReorderIndicators();
    reorderLinkTargetInfo = null;
    if (dragOverCollectionId) {
      collectionsContainer.querySelector(`.collection[data-collection-id="${dragOverCollectionId}"]`)?.classList.remove('drag-over');
      dragOverCollectionId = null;
    }
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
  }
  function handleCollectionDragEnd(event) {
    const draggedElement = collectionsContainer.querySelector(`.collection[data-collection-id="${draggedCollectionId}"]`);
    draggedElement?.classList.remove('dragging');
    clearReorderIndicators();
    draggedCollectionId = null;
    reorderTargetInfo = null;
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
      draggedCollectionId = null;
      reorderTargetInfo = null;
      return;
    }
    const draggedId = draggedCollectionId;
    const targetId = reorderTargetInfo.targetId;
    const dropPosition = reorderTargetInfo.position;
    draggedCollectionId = null;
    reorderTargetInfo = null;
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
  }
  function clearReorderIndicators() {
    collectionsContainer.querySelectorAll('.collection.reorder-over-top, .collection.reorder-over-bottom').forEach((el) => {
      el.classList.remove('reorder-over-top', 'reorder-over-bottom');
    });
  }
  function clearLinkReorderIndicators() {
    collectionsContainer.querySelectorAll('.link-block.reorder-link-before, .link-block.reorder-link-after').forEach((el) => {
      el.classList.remove('reorder-link-before', 'reorder-link-after');
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
    if (action === 'delete-link' && collectionId) {
      const deleteBtn = target.closest('[data-action="delete-link"]');
      const linkId = deleteBtn?.dataset.linkId || linkBlock?.dataset.linkId;
      if (!linkId) return;
      if (linkBlock) {
        linkBlock.classList.add('link-block--removing');
        linkBlock.addEventListener('animationend', () => deleteLink(collectionId, linkId), { once: true });
      } else {
        deleteLink(collectionId, linkId);
      }
    }
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
  function resetSearch() {
    searchTerm = '';
    searchInput.value = '';
  }
  function handleSearchInput() {
    searchTerm = searchInput.value.trim();
    if (searchTarget === 'collections') renderCollections();
    else renderTabsList();
  }
  function handleSearchTargetChange(event) {
    if (event.target.name === 'search-target') {
      searchTarget = event.target.value;
      searchInput.placeholder = searchTarget === 'collections' ? 'Search Collections...' : 'Search Open Tabs...';
      searchInput.ariaLabel = searchTarget === 'collections' ? 'Search Collections' : 'Search Open Tabs';
      resetSearch();
      renderCollections();
      renderTabsList();
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
    const newCollection = { id: crypto.randomUUID(), name: `New Collection`, isCollapsed: false, links: [] };
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
  }
  function deleteCollectionById(collectionId) {
    const index = collections.findIndex((c) => c.id == collectionId);
    if (index === -1) return;
    if (confirm(`Delete "${collections[index].name}"?`)) {
      collections.splice(index, 1);
      renderCollections();
      saveData();
    }
  }
  function updateCollectionTitle(collectionId, newName) {
    const collection = collections.find((c) => c.id == collectionId);
    const trimmedName = newName.trim();
    if (collection && collection.name !== trimmedName) {
      collection.name = trimmedName || 'Untitled Collection';
      saveData();
      const input = collectionsContainer.querySelector(`.collection[data-collection-id="${collectionId}"] .collection-title-input`);
      if (input) input.value = collection.name;
    }
  }
  function navigateToLink(event, url) {
    if (!url || !isSafeUrl(url)) return;
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
    if (!isExtensionContext() || !browser.storage) {
      console.warn('Storage API not available.');
      collections = [];
      renderCollections();
      return;
    }
    try {
      const result = await browser.storage.local.get('collections');
      collections = (result.collections || []).map((c) => ({ ...c, id: c.id || crypto.randomUUID(), isCollapsed: c.isCollapsed || false, links: Array.isArray(c.links) ? c.links.map((l) => ({ ...l, id: l.id || crypto.randomUUID(), favIconUrl: l.favIconUrl || null })) : [] }));
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
    const validatedCollections = collections.map((c) => ({ id: c.id || crypto.randomUUID(), name: typeof c.name === 'string' ? c.name.trim() || 'Untitled Collection' : 'Untitled Collection', isCollapsed: c.isCollapsed || false, links: Array.isArray(c.links) ? c.links.map((l) => ({ id: l.id || crypto.randomUUID(), url: typeof l.url === 'string' ? l.url : '#', title: typeof l.title === 'string' && l.title.trim() ? l.title.trim() : l.url || 'Untitled Link', favIconUrl: l.favIconUrl || null })) : [] }));
    pendingSaveCount++;
    try {
      await browser.storage.local.set({ collections: validatedCollections });
    } catch (error) {
      console.error('Error saving data:', error);
      pendingSaveCount = Math.max(0, pendingSaveCount - 1);
    }
  }
  async function fetchOpenTabs() {
    tabsListContainer.innerHTML = '<div class="loading-indicator">Loading tabs...</div>';
    if (!isExtensionContext() || !browser.tabs) {
      console.warn('Tabs API not available.');
      openTabs = [];
      renderTabsList();
      return;
    }
    try {
      const tabs = await browser.tabs.query({ currentWindow: true });
      const filtered = tabs.filter((tab) => tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('moz-extension:'));

      let identityMap = {};
      if (browser.contextualIdentities) {
        try {
          const identities = await browser.contextualIdentities.query({});
          identityMap = Object.fromEntries(identities.map((i) => [i.cookieStoreId, i]));
        } catch (e) {
          // Containers disabled or unavailable — proceed without colors
        }
      }

      openTabs = filtered.map((tab) => {
        const identity = identityMap[tab.cookieStoreId];
        return { ...tab, containerColor: identity?.colorCode || null, containerName: identity?.name || null };
      });
    } catch (error) {
      console.error('Error fetching tabs:', error);
      openTabs = [];
    } finally {
      renderTabsList();
    }
  }
  // --- Toast ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    const dismiss = () => {
      toast.classList.add('toast--out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };
    const timer = setTimeout(dismiss, 3000);
    toast.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
  }

  // --- Import modal ---
  let importState = { parsedCollections: null, format: null, skippedLinks: 0, diff: null, mode: 'merge', resolutions: {} };

  function openImportModal() {
    resetImportModal();
    document.getElementById('import-modal').hidden = false;
  }

  function closeImportModal() {
    document.getElementById('import-modal').hidden = true;
    resetImportModal();
  }

  function resetImportModal() {
    importState = { parsedCollections: null, format: null, skippedLinks: 0, diff: null, mode: 'merge', resolutions: {} };
    showImportStep('upload');
    importFileInput.value = '';
    const errorEl = document.getElementById('import-error');
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function showImportStep(step) {
    ['upload', 'preview', 'conflicts'].forEach((s) => {
      document.getElementById(`import-step-${s}`).hidden = s !== step;
    });
    const titles = { upload: 'Import Collections', preview: 'Import Collections', conflicts: 'Resolve Conflicts' };
    document.getElementById('import-modal-title').textContent = titles[step];

    const backBtn = document.getElementById('import-btn-back');
    const primaryBtn = document.getElementById('import-btn-primary');

    if (step === 'upload') {
      backBtn.textContent = 'Cancel';
      backBtn.onclick = closeImportModal;
      primaryBtn.textContent = 'Continue';
      primaryBtn.disabled = true;
      primaryBtn.onclick = null;
    } else if (step === 'preview') {
      backBtn.textContent = 'Back';
      backBtn.onclick = () => {
        importFileInput.value = '';
        document.getElementById('import-error').hidden = true;
        importState.parsedCollections = null;
        importState.diff = null;
        showImportStep('upload');
      };
      primaryBtn.textContent = 'Continue';
      primaryBtn.disabled = false;
      primaryBtn.onclick = handleImportContinue;
    } else if (step === 'conflicts') {
      backBtn.textContent = 'Back';
      backBtn.onclick = () => showImportStep('preview');
      primaryBtn.textContent = 'Import';
      primaryBtn.disabled = false;
      primaryBtn.onclick = executeImport;
    }
  }

  function parseImportFile(file) {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    const errorEl = document.getElementById('import-error');
    if (file.size > maxSize) {
      errorEl.textContent = `File too large (max ${maxSize / 1024 / 1024}MB).`;
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      let parsed = [];
      let format = 'native';
      let skippedLinks = 0;
      try {
        const rawData = JSON.parse(e.target.result);
        if (rawData && rawData.version === 3 && Array.isArray(rawData.lists)) {
          format = 'toby';
          parsed = rawData.lists.map((list) => {
            if (typeof list !== 'object' || list === null || typeof list.title !== 'string' || !Array.isArray(list.cards))
              throw new Error(`Invalid Toby list: ${list.title || 'Untitled'}`);
            const links = list.cards.reduce((acc, card) => {
              if (typeof card !== 'object' || card === null || typeof card.url !== 'string' || !card.url)
                throw new Error(`Invalid Toby card in list "${list.title}"`);
              if (!isSafeUrl(card.url)) { skippedLinks++; return acc; }
              const title = typeof card.title === 'string' && card.title.trim() ? card.title.trim() : card.url;
              acc.push({ id: crypto.randomUUID(), url: card.url, title, favIconUrl: null });
              return acc;
            }, []);
            return { id: crypto.randomUUID(), name: list.title.trim() || 'Untitled Collection', isCollapsed: false, links };
          });
        } else if (rawData && typeof rawData === 'object' && !Array.isArray(rawData) && typeof rawData.title === 'string' && Array.isArray(rawData.items)) {
          format = 'pocket';
          const links = rawData.items.reduce((acc, item) => {
            if (!item || typeof item.url !== 'string' || !item.url) return acc;
            if (!isSafeUrl(item.url)) { skippedLinks++; return acc; }
            const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : item.url;
            acc.push({ id: crypto.randomUUID(), url: item.url, title, favIconUrl: null });
            return acc;
          }, []);
          parsed = [{ id: crypto.randomUUID(), name: rawData.title.trim() || 'Pocket Import', isCollapsed: false, links }];
        } else if (Array.isArray(rawData)) {
          parsed = rawData.map((c, i) => {
            if (typeof c !== 'object' || c === null || typeof c.name !== 'string' || !Array.isArray(c.links))
              throw new Error(`Invalid collection at index ${i}.`);
            const links = c.links.reduce((acc, l, li) => {
              if (typeof l !== 'object' || l === null || typeof l.url !== 'string' || !l.url)
                throw new Error(`Invalid link at index ${li} in "${c.name}".`);
              if (!isSafeUrl(l.url)) { skippedLinks++; return acc; }
              const title = typeof l.title === 'string' && l.title.trim() ? l.title.trim() : l.url;
              acc.push({ id: l.id || crypto.randomUUID(), url: l.url, title, favIconUrl: l.favIconUrl || null });
              return acc;
            }, []);
            return { id: c.id || crypto.randomUUID(), name: c.name.trim() || `Collection ${i + 1}`, isCollapsed: false, links };
          });
        } else {
          throw new Error('Unrecognized format — expected a Tab Blocks or Toby JSON export.');
        }
        importState.parsedCollections = parsed;
        importState.format = format;
        importState.skippedLinks = skippedLinks;
        importState.diff = computeImportDiff(parsed);
        populatePreviewStep(file.name, parsed);
        showImportStep('preview');
      } catch (err) {
        console.error('Import parse error:', err);
        errorEl.textContent = err.message || 'Invalid file. Make sure you\'re importing a Tab Blocks or Toby JSON export.';
        errorEl.hidden = false;
        importFileInput.value = '';
      }
    };
    reader.onerror = () => {
      errorEl.textContent = 'Could not read the file.';
      errorEl.hidden = false;
      importFileInput.value = '';
    };
    reader.readAsText(file);
  }

  function computeImportDiff(importedCollections) {
    const newCollections = [];
    const autoMerge = [];
    const conflicts = [];
    for (const imported of importedCollections) {
      const idMatch = collections.find((c) => c.id === imported.id);
      const nameLower = imported.name.trim().toLowerCase();
      const nameMatch = collections.find((c) => c.name.trim().toLowerCase() === nameLower);
      if (idMatch) {
        if (idMatch.name.trim().toLowerCase() === nameLower) {
          const existingUrls = new Set(idMatch.links.map((l) => l.url));
          const newLinks = imported.links.filter((l) => !existingUrls.has(l.url)).length;
          const dupes = imported.links.length - newLinks;
          autoMerge.push({ imported, existing: idMatch, newLinks, dupes });
        } else {
          conflicts.push({ type: 'id-rename', imported, existing: idMatch });
        }
      } else if (nameMatch) {
        conflicts.push({ type: 'name-match', imported, existing: nameMatch });
      } else {
        newCollections.push(imported);
      }
    }
    return { newCollections, autoMerge, conflicts };
  }

  function populatePreviewStep(fileName, parsedCollections) {
    const totalLinks = parsedCollections.reduce((sum, c) => sum + c.links.length, 0);
    const { newCollections, autoMerge, conflicts } = importState.diff;
    const existingTotal = collections.reduce((sum, c) => sum + c.links.length, 0);

    const fileInfoEl = document.getElementById('import-file-info');
    fileInfoEl.innerHTML = '';
    const nameEl = document.createElement('strong');
    nameEl.textContent = fileName;
    const statsEl = document.createElement('span');
    statsEl.textContent = `${parsedCollections.length} collection${parsedCollections.length !== 1 ? 's' : ''}, ${totalLinks} link${totalLinks !== 1 ? 's' : ''}`;
    const formatEl = document.createElement('span');
    formatEl.className = 'import-file-format';
    const formatLabels = { toby: 'Toby format', pocket: 'Pocket format', native: 'Tab Blocks format' };
    formatEl.textContent = formatLabels[importState.format] || 'Tab Blocks format';
    if (importState.skippedLinks > 0) {
      const skipEl = document.createElement('span');
      skipEl.className = 'import-file-format';
      skipEl.textContent = `${importState.skippedLinks} link${importState.skippedLinks !== 1 ? 's' : ''} with unsafe URLs will be skipped`;
      fileInfoEl.appendChild(skipEl);
    }
    fileInfoEl.appendChild(nameEl);
    fileInfoEl.appendChild(statsEl);
    fileInfoEl.appendChild(formatEl);

    const mergeParts = [];
    if (newCollections.length) mergeParts.push(`${newCollections.length} new`);
    if (autoMerge.length) mergeParts.push(`${autoMerge.length} will merge`);
    if (conflicts.length) mergeParts.push(`${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''} to resolve`);
    document.getElementById('import-merge-desc').textContent = mergeParts.length ? mergeParts.join(' · ') : 'Nothing new to add';

    document.getElementById('import-override-desc').textContent =
      `Replaces your current ${collections.length} collection${collections.length !== 1 ? 's' : ''} and ${existingTotal} link${existingTotal !== 1 ? 's' : ''}`;

    document.querySelector('input[name="import-mode"][value="merge"]').checked = true;
    importState.mode = 'merge';
  }

  function handleImportContinue() {
    const selected = document.querySelector('input[name="import-mode"]:checked');
    importState.mode = selected ? selected.value : 'merge';
    if (importState.mode === 'override') {
      executeImport();
      return;
    }
    const { conflicts } = importState.diff;
    if (!conflicts.length) {
      executeImport();
      return;
    }
    conflicts.forEach((c) => { importState.resolutions[c.imported.id] = 'merge'; });
    buildConflictUI(conflicts);
    showImportStep('conflicts');
  }

  function buildConflictUI(conflicts) {
    const list = document.getElementById('import-conflicts-list');
    list.innerHTML = '';
    conflicts.forEach((conflict) => {
      const item = document.createElement('div');
      item.className = 'conflict-item';

      const header = document.createElement('div');
      header.className = 'conflict-item-header';
      const nameEl = document.createElement('span');
      nameEl.className = 'conflict-name';
      const badge = document.createElement('span');
      badge.className = 'conflict-badge';
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'conflict-options';

      const existingUrls = new Set(conflict.existing.links.map((l) => l.url));
      const newLinkCount = conflict.imported.links.filter((l) => !existingUrls.has(l.url)).length;
      const radioName = `conflict-${conflict.imported.id}`;

      if (conflict.type === 'name-match') {
        nameEl.textContent = `"${conflict.imported.name}"`;
        badge.classList.add('conflict-badge--name-match');
        badge.textContent = 'Same name, different source';

        const mergeLabel = buildConflictOption(radioName, 'merge', true,
          `Merge into existing "${conflict.existing.name}"`,
          `adds ${newLinkCount} new link${newLinkCount !== 1 ? 's' : ''}, skips duplicates`);
        const separateLabel = buildConflictOption(radioName, 'separate', false,
          'Keep separate',
          `creates a second "${conflict.imported.name}"`);
        optionsDiv.appendChild(mergeLabel);
        optionsDiv.appendChild(separateLabel);
      } else {
        nameEl.textContent = `"${conflict.existing.name}" → "${conflict.imported.name}"`;
        badge.classList.add('conflict-badge--id-rename');
        badge.textContent = 'Renamed';

        const mergeLabel = buildConflictOption(radioName, 'merge', true,
          `Merge into "${conflict.existing.name}"`,
          `keeps existing name, adds ${newLinkCount} new link${newLinkCount !== 1 ? 's' : ''}`);
        const bothLabel = buildConflictOption(radioName, 'both', false,
          'Keep both',
          `creates a separate "${conflict.imported.name}"`);
        optionsDiv.appendChild(mergeLabel);
        optionsDiv.appendChild(bothLabel);
      }

      optionsDiv.querySelectorAll('input[type="radio"]').forEach((radio) => {
        radio.addEventListener('change', (e) => { importState.resolutions[conflict.imported.id] = e.target.value; });
      });

      header.appendChild(nameEl);
      header.appendChild(badge);
      item.appendChild(header);
      item.appendChild(optionsDiv);
      list.appendChild(item);
    });
  }

  function buildConflictOption(radioName, value, checked, labelText, detailText) {
    const label = document.createElement('label');
    label.className = 'conflict-option';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = radioName;
    radio.value = value;
    radio.checked = checked;
    const textSpan = document.createElement('span');
    textSpan.textContent = labelText + ' ';
    const detailSpan = document.createElement('span');
    detailSpan.className = 'conflict-option-detail';
    detailSpan.textContent = `(${detailText})`;
    textSpan.appendChild(detailSpan);
    label.appendChild(radio);
    label.appendChild(textSpan);
    return label;
  }

  function mergeLinksInto(targetCollection, importedLinks) {
    const existingUrls = new Set(targetCollection.links.map((l) => l.url));
    for (const link of importedLinks) {
      if (!existingUrls.has(link.url)) {
        targetCollection.links.push({ ...link });
        existingUrls.add(link.url);
      }
    }
  }

  function executeImport() {
    let toastMsg = '';
    if (importState.mode === 'override') {
      collections = importState.parsedCollections.map((c) => ({
        ...c, isCollapsed: false, links: c.links.map((l) => ({ ...l })),
      }));
      const total = collections.reduce((s, c) => s + c.links.length, 0);
      toastMsg = `Replaced with ${collections.length} collection${collections.length !== 1 ? 's' : ''} and ${total} link${total !== 1 ? 's' : ''}`;
    } else {
      const result = collections.map((c) => ({ ...c, links: c.links.map((l) => ({ ...l })) }));
      const { newCollections, autoMerge, conflicts } = importState.diff;
      let addedLinks = 0;

      for (const { imported, existing } of autoMerge) {
        const target = result.find((c) => c.id === existing.id);
        if (target) { const before = target.links.length; mergeLinksInto(target, imported.links); addedLinks += target.links.length - before; target.isCollapsed = false; }
      }

      for (const conflict of conflicts) {
        const resolution = importState.resolutions[conflict.imported.id] || 'merge';
        if (resolution === 'merge') {
          const target = result.find((c) => c.id === conflict.existing.id);
          if (target) { const before = target.links.length; mergeLinksInto(target, conflict.imported.links); addedLinks += target.links.length - before; target.isCollapsed = false; }
        } else {
          result.push({ ...conflict.imported, id: crypto.randomUUID(), isCollapsed: false, links: conflict.imported.links.map((l) => ({ ...l })) });
        }
      }

      for (const col of newCollections) {
        result.push({ ...col, isCollapsed: false, links: col.links.map((l) => ({ ...l })) });
      }
      collections = result;

      const parts = [];
      if (newCollections.length) parts.push(`${newCollections.length} new collection${newCollections.length !== 1 ? 's' : ''}`);
      if (addedLinks) parts.push(`${addedLinks} link${addedLinks !== 1 ? 's' : ''} added`);
      toastMsg = parts.length ? `Import complete — ${parts.join(', ')}` : 'Import complete — nothing new to add';
    }

    renderCollections();
    saveData();
    updateCollapseAllButtonState();
    closeImportModal();
    showToast(toastMsg);
  }
  function exportData() {
    try {
      const dataStr = JSON.stringify(collections, null, 2);
      const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const a = document.createElement('a');
      a.href = dataUrl;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `tab_blocks_config--${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export.');
    }
  }

  // --- Mobile helpers ---
  function addLongPressHandler(element, callback) {
    let timer = null;
    element.addEventListener('touchstart', (e) => {
      timer = setTimeout(() => {
        timer = null;
        callback();
      }, 500);
    }, { passive: true });
    element.addEventListener('touchend', () => { if (timer) { clearTimeout(timer); timer = null; } });
    element.addEventListener('touchmove', () => { if (timer) { clearTimeout(timer); timer = null; } });
  }

  function createAddLinkBlock(collectionId) {
    const block = document.createElement('div');
    block.className = 'link-block link-block--add';
    block.dataset.addLinkCollectionId = collectionId;
    setElementContent(block, `<div class="f-icon">${plusIconSVG}</div>`, true);
    block.addEventListener('click', () => openTabSheet(collectionId));
    return block;
  }

  function openTabSheet(collectionId) {
    mobileTargetCollectionId = collectionId;
    renderSheetTabs();
    mobileTabSheet.hidden = false;
  }

  function closeTabSheet() {
    mobileTabSheet.hidden = true;
    mobileTargetCollectionId = null;
  }

  async function renderSheetTabs() {
    const sheetTabsList = document.getElementById('sheet-tabs-list');
    sheetTabsList.innerHTML = '';
    let tabs = [];
    try {
      tabs = await browser.tabs.query({ currentWindow: true });
    } catch (e) { /* no tabs API */ }
    if (!tabs.length) {
      const msg = document.createElement('div');
      msg.className = 'empty-collection-message';
      setElementContent(msg, 'No open tabs found.');
      sheetTabsList.appendChild(msg);
      return;
    }
    tabs.forEach((tab) => {
      const row = document.createElement('div');
      row.className = 'tab-item';
      const favicon = document.createElement('img');
      favicon.className = 'tab-favicon';
      favicon.src = tab.favIconUrl || '';
      favicon.alt = '';
      favicon.onerror = () => { favicon.style.display = 'none'; };
      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      setElementContent(titleSpan, tab.title || tab.url);
      row.appendChild(favicon);
      row.appendChild(titleSpan);
      row.addEventListener('click', () => addTabFromSheet(tab));
      sheetTabsList.appendChild(row);
    });
  }

  function addTabFromSheet(tab) {
    if (!mobileTargetCollectionId) return;
    const collection = collections.find(c => c.id === mobileTargetCollectionId);
    if (!collection) return;
    if (!isSafeUrl(tab.url)) return;
    const newId = crypto.randomUUID();
    pendingEnterAnimations.set(newId, 0);
    collection.links.push({
      id: newId,
      url: tab.url,
      title: tab.title || tab.url,
      favIconUrl: tab.favIconUrl || null,
    });
    closeTabSheet();
    renderCollections();
    saveData();
  }

  function openCollectionModal(collectionId) {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;
    mobileEditingCollectionId = collectionId;
    const modal = document.getElementById('mobile-collection-modal');
    document.getElementById('modal-collection-title').value = collection.name;
    modal.hidden = false;
  }

  function closeCollectionModal() {
    document.getElementById('mobile-collection-modal').hidden = true;
    mobileEditingCollectionId = null;
  }

  function openLinkModal(collectionId, linkId) {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;
    const link = collection.links.find(l => l.id === linkId);
    if (!link) return;
    mobileEditingCollectionId = collectionId;
    mobileEditingLinkId = linkId;
    const modal = document.getElementById('mobile-link-modal');
    document.getElementById('modal-link-title').value = link.title || '';
    modal.hidden = false;
  }

  function closeLinkModal() {
    document.getElementById('mobile-link-modal').hidden = true;
    mobileEditingCollectionId = null;
    mobileEditingLinkId = null;
  }

  // --- Initialization ---
  addCollectionBtn.addEventListener('click', addCollection);
  refreshTabsBtn.addEventListener('click', fetchOpenTabs);
  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', openImportModal);
  document.getElementById('import-modal-backdrop').addEventListener('click', closeImportModal);
  document.getElementById('import-modal-close').addEventListener('click', closeImportModal);
  importFileInput.addEventListener('change', (e) => { parseImportFile(e.target.files[0]); });
  const importDropzone = document.getElementById('import-dropzone');
  importDropzone.addEventListener('dragover', (e) => { e.preventDefault(); importDropzone.classList.add('drag-over'); });
  importDropzone.addEventListener('dragleave', () => importDropzone.classList.remove('drag-over'));
  importDropzone.addEventListener('drop', (e) => { e.preventDefault(); importDropzone.classList.remove('drag-over'); parseImportFile(e.dataTransfer.files[0]); });
  collectionsContainer.addEventListener('click', handleCollectionsClick);
  collectionsContainer.addEventListener('change', handleCollectionsInput);
  collectionsContainer.addEventListener('dragover', handleCollectionDragOver);
  collectionsContainer.addEventListener('dragleave', handleCollectionDragLeaveContainer);
  collectionsContainer.addEventListener('drop', handleCollectionDrop);
  collapseAllBtn.addEventListener('click', toggleCollapseAll);
  searchInput.addEventListener('input', handleSearchInput);
  searchToggleContainer.addEventListener('change', handleSearchTargetChange);

  if (isMobile) {
    document.getElementById('sheet-close').addEventListener('click', closeTabSheet);
    document.getElementById('sheet-backdrop').addEventListener('click', closeTabSheet);

    document.getElementById('modal-collection-save').addEventListener('click', () => {
      if (!mobileEditingCollectionId) return;
      const newName = document.getElementById('modal-collection-title').value.trim();
      if (newName) updateCollectionTitle(mobileEditingCollectionId, newName);
      closeCollectionModal();
      renderCollections();
    });
    document.getElementById('modal-collection-delete').addEventListener('click', () => {
      const id = mobileEditingCollectionId;
      closeCollectionModal();
      deleteCollectionById(id);
    });
    document.getElementById('collection-modal-backdrop').addEventListener('click', closeCollectionModal);

    document.getElementById('modal-link-save').addEventListener('click', () => {
      if (!mobileEditingCollectionId || !mobileEditingLinkId) return;
      const collection = collections.find(c => c.id === mobileEditingCollectionId);
      if (!collection) return;
      const link = collection.links.find(l => l.id === mobileEditingLinkId);
      if (link) {
        const newTitle = document.getElementById('modal-link-title').value.trim();
        if (newTitle) link.title = newTitle;
      }
      closeLinkModal();
      renderCollections();
      saveData();
    });
    document.getElementById('modal-link-delete').addEventListener('click', () => {
      const cId = mobileEditingCollectionId;
      const lId = mobileEditingLinkId;
      closeLinkModal();
      deleteLink(cId, lId);
    });
    document.getElementById('link-modal-backdrop').addEventListener('click', closeLinkModal);
  }

  loadData();
  fetchOpenTabs();
  if (isExtensionContext()) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.collections) {
        if (pendingSaveCount > 0) {
          pendingSaveCount--;
          return;
        }
        loadData();
      }
    });
  }
});