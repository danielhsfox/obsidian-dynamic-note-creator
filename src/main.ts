/**
 * Dynamic Note Creator - Obsidian Plugin
 * Copyright (c) 2025 danielhsfox
 * @license MIT
 */

// Añade esta interfaz al inicio del archivo
interface TemplaterPlugin {
    read_and_parse_template: (templateFile: any, variables?: any) => Promise<string>;
    parse_template: (content: string, variables?: any) => Promise<string>;
}

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PluginConfigItem {
	path: string;
	nameButton: string;
	colorButton: string;
	backgroundButton: string;
	emoji?: string;
	pathTemplate: string;
}

interface DynamicSearchSettings {
	title: string;
	configItems: PluginConfigItem[];
}

const DEFAULT_SETTINGS: DynamicSearchSettings = {
	title: 'Search:',
	configItems: [
		{
			path: 'Notes/',
			nameButton: '➕ Add Note',
			colorButton: '#ffffff',
			backgroundButton: '#814ae8',
			emoji: '📝',
			pathTemplate: 'templates/default.md'
		}
	]
}

 
interface SearchResult {
	file: any;
	content: string;
	matchesName: boolean;
	matchesContent: boolean;
	isBacklink: boolean;  // Añadir esta propiedad
}

interface BlockConfig {
    title?: string;
    sortBy?: 'name' | 'date';  // Añadir
    sortOrder?: 'asc' | 'desc'; // Añadir
    configItems?: PluginConfigItem[];
}

export default class DynamicNoteCreator extends Plugin {
	settings: DynamicSearchSettings;
	private modal: CreateNoteModal | null = null;

	async onload() {
		await this.loadSettings();
		
		console.log('Loading Dynamic Note Creator Plugin');

		// Registrar el procesador de bloques de código
		this.registerMarkdownCodeBlockProcessor("dynamicsearch", async (source, el, ctx) => {
			await this.renderDynamicSearch(source, el, ctx);
		});

		// Añadir comando para insertar bloque de código
		this.addCommand({
			id: 'insert-dynamic-note-creator-block',
			name: 'Insert Dynamic Note Creator block',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.insertDynamicSearchBlock(editor);
			}
		});

		// Añadir pestaña de configuración
		this.addSettingTab(new DynamicNoteCreatorSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

private insertDynamicSearchBlock(editor: Editor) {
    const cursor = editor.getCursor();
    
    // Crear el contenido del bloque con el nuevo formato
    const blockLines = [
        '```dynamicsearch', 
        `title: ${this.settings.title}`,
        'sortBy: name',
        'sortOrder: asc'
    ];
    
    // Añadir cada configuración como bloque separado por '---'
    this.settings.configItems.forEach(item => {
        blockLines.push('---');
        // Si el path está vacío, usar "current" como valor por defecto
        const pathValue = item.path && item.path !== 'Notes/' ? item.path : 'current';
        blockLines.push(`path: ${pathValue}`);
        blockLines.push(`nameButton: ${item.nameButton}`);
        blockLines.push(`colorButton: ${item.colorButton}`);
        blockLines.push(`backgroundButton: ${item.backgroundButton}`);
        if (item.emoji) {
            blockLines.push(`emoji: ${item.emoji}`);
        }
        blockLines.push(`pathTemplate: ${item.pathTemplate}`);
    });
    
    blockLines.push('```', '', '');
    
    const blockContent = blockLines.join('\n');
    const totalLines = blockLines.length;
    
    editor.replaceRange(blockContent, cursor);
    
    // Calcular nueva posición del cursor
    const newCursor = {
        line: cursor.line + totalLines,
        ch: 0
    };
    
    editor.setCursor(newCursor);
    editor.focus();
    
    new Notice('Dynamic Note Creator block inserted');
}

	normalizeText(text: string): string {
		if (!text) return '';
		
		return text.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');
	}

async renderDynamicSearch(source: string, container: HTMLElement, ctx: any) {
	container.empty();

	// Obtener la ruta del archivo que contiene el bloque
    const currentFilePath = ctx.sourcePath;
    console.log('Block source path:', currentFilePath);
	
	// Pasar el path al parseConfig
    const config = this.parseConfig(source, currentFilePath);
	console.log('Block path:', currentFilePath);
console.log('Config items:', config.configItems);
	
	const wrapper = document.createElement('div');
	wrapper.className = 'dynamic-note-creator-wrapper';
	
	// Fila superior con título
	const topRow = document.createElement('div');
	topRow.className = 'dynamic-note-creator-top-row';
	
	const label = document.createElement('label');
	label.textContent = config.title || this.settings.title;
	
	// Contenedor para label + botones
	const rightContainer = document.createElement('div');
	rightContainer.className = 'dynamic-note-creator-right-container';
	
	// Contenedor para múltiples botones
	const buttonsContainer = document.createElement('div');
	buttonsContainer.className = 'dynamic-note-creator-buttons-container';
	
	// Crear botones para cada configuración
	if (config.configItems && config.configItems.length > 0) {
		config.configItems.forEach((item, index) => {
			const button = document.createElement('button');
			button.textContent = item.nameButton;
			button.className = 'dynamic-note-creator-button';
			button.style.color = item.colorButton;
			button.style.backgroundColor = item.backgroundButton;
			button.dataset.index = index.toString();
			
			button.addEventListener('click', () => {
				this.showCreateNotePopup(item, config, () => {
					performSearch(currentSearchText, selectedEmoji);
				});
			});
			
			buttonsContainer.appendChild(button);
		});
	}
	
	rightContainer.appendChild(buttonsContainer);
	topRow.appendChild(label);
	topRow.appendChild(rightContainer);
	
	// Fila de búsqueda con input y selector
	const searchRow = document.createElement('div');
	searchRow.className = 'dynamic-note-creator-search-row';
	
	// Input de búsqueda
	const input = document.createElement('input');
	input.type = 'text';
	input.placeholder = 'Search notes...';
	input.className = 'dynamic-note-creator-input';
	
	// Selector de emojis
	const emojiSelect = document.createElement('select');
	emojiSelect.className = 'dynamic-note-creator-emoji-select';
	
	searchRow.appendChild(input);
	searchRow.appendChild(emojiSelect);
	
	// Contador de resultados
	const resultsCounter = document.createElement('div');
	resultsCounter.className = 'dynamic-note-creator-counter';
	
	// Lista de resultados
	const list = document.createElement('ul');
	list.className = 'dynamic-note-creator-list';
	
	wrapper.appendChild(topRow);
	wrapper.appendChild(searchRow);
	wrapper.appendChild(resultsCounter);
	wrapper.appendChild(list);
	container.appendChild(wrapper);
	
    const currentFile = this.app.workspace.getActiveFile();
    const currentPath = currentFile ? currentFile.path : '';
    const currentTitle = currentFile ? currentFile.basename : ''; // AÑADIR ESTA LÍNEA
    
    let currentSearchText = '';
    let selectedEmoji = '';
    let searchTimeout: NodeJS.Timeout | null = null;
	
	// Función para extraer emoji del nombre del archivo
	const extractEmojiFromFilename = (filename: string): string | null => {
		const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s/u;
		const match = filename.match(emojiRegex);
		return match ? match[1] : null;
	};
	
	// Función para cargar todos los emojis disponibles inicialmente
const loadAllEmojis = async () => {
    const allPaths = config.configItems
        ?.filter(item => item && item.path !== undefined && item.path !== null)
        .map(item => item.path) || [];
    
    console.log('Search paths:', allPaths);
    
    const files = this.app.vault.getMarkdownFiles();
    const emojiCounts = new Map<string, number>();
    
    for (const file of files) {
        // Si no hay paths definidos, incluir todos los archivos excepto el actual
        const isInPath = allPaths.length === 0 || allPaths.some(path => file.path.startsWith(path));
        const isNotCurrent = file.path !== currentPath;
        
        if (isInPath && isNotCurrent) {
            const emoji = extractEmojiFromFilename(file.basename);
            if (emoji) {
                const currentCount = emojiCounts.get(emoji) || 0;
                emojiCounts.set(emoji, currentCount + 1);
            }
        }
    }
    
    // Limpiar selector
    emojiSelect.innerHTML = '';
    
    // Opción por defecto
    const totalNotes = Array.from(emojiCounts.values()).reduce((sum, count) => sum + count, 0);
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    // defaultOption.textContent = `🎯 All notes (${totalNotes})`;
	defaultOption.textContent = `🎯 All notes`; // Quitamos el (${totalNotes})
    emojiSelect.appendChild(defaultOption);
    
    // Añadir emojis con contadores
    const sortedEmojis = Array.from(emojiCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    sortedEmojis.forEach(([emoji, count]) => {
        const option = document.createElement('option');
        option.value = emoji;
        option.textContent = `${emoji} (${count})`;
        emojiSelect.appendChild(option);
    });
    
    // Restaurar selección
    if (selectedEmoji && emojiCounts.has(selectedEmoji)) {
        emojiSelect.value = selectedEmoji;
    } else {
        selectedEmoji = '';
        emojiSelect.value = '';
    }
};
	
const performSearch = async (searchText: string, emojiFilter: string = '') => {
    currentSearchText = searchText;
    selectedEmoji = emojiFilter;
    
    list.innerHTML = '';
    resultsCounter.textContent = 'Searching...';
    
    const filter = this.normalizeText(searchText.trim());
    const files = this.app.vault.getMarkdownFiles();
    
    let results: SearchResult[] = [];
    
    // Obtener todos los paths configurados
    const allPaths = config.configItems
        ?.filter(item => item && item.path !== undefined && item.path !== null)
        .map(item => item.path) || [];
    
    // CASO 1: Hay texto de búsqueda
    if (filter) {
        for (const file of files) {
            try {
                // Si no hay paths, incluir todos los archivos excepto el actual
                const isInPath = allPaths.length === 0 || allPaths.some(path => file.path.startsWith(path));
                const isNotCurrent = file.path !== currentPath;
                
                const fileEmoji = extractEmojiFromFilename(file.basename);
                const matchesEmoji = !emojiFilter || fileEmoji === emojiFilter;
                
                if (isInPath && isNotCurrent && matchesEmoji) {
                    const content = await this.app.vault.cachedRead(file);
                    const contentNormalized = this.normalizeText(content);
                    const fileNameNormalized = this.normalizeText(file.basename);
                    
                    const matchesName = fileNameNormalized.includes(filter);
                    const matchesContent = contentNormalized.includes(filter);
                    
                    if (matchesName || matchesContent) {
                        results.push({
                            file: file,
                            content: content,
                            matchesName: matchesName,
                            matchesContent: matchesContent,
                            isBacklink: false
                        });
                    }
                }
            } catch (error) {
                console.error('Error reading file:', file.path, error);
            }
        }
    } 
    // CASO 2: No hay texto de búsqueda pero HAY filtro de emoji
    else if (emojiFilter) {
        for (const file of files) {
            try {
                const isInPath = allPaths.length === 0 || allPaths.some(path => file.path.startsWith(path));
                const isNotCurrent = file.path !== currentPath;
                
                const fileEmoji = extractEmojiFromFilename(file.basename);
                const matchesEmoji = fileEmoji === emojiFilter;
                
                if (isInPath && isNotCurrent && matchesEmoji) {
                    const content = await this.app.vault.cachedRead(file);
                    
                    results.push({
                        file: file,
                        content: content,
                        matchesName: true,
                        matchesContent: false,
                        isBacklink: false
                    });
                }
            } catch (error) {
                console.error('Error reading file:', file.path, error);
            }
        }
    }
    // CASO 3: No hay texto ni emoji - mostrar backlinks
    else {
        for (const file of files) {
            try {
                const isInPath = allPaths.length === 0 || allPaths.some(path => file.path.startsWith(path));
                const isNotCurrent = file.path !== currentPath;
                
                if (isInPath && isNotCurrent) {
                    const content = await this.app.vault.cachedRead(file);
                    const hasLink = this.containsLinkToNote(content, currentTitle);
                    
                    if (hasLink) {
                        results.push({
                            file: file,
                            content: content,
                            matchesName: false,
                            matchesContent: false,
                            isBacklink: true
                        });
                    }
                }
            } catch (error) {
                console.error('Error reading file:', file.path, error);
            }
        }
    }
    
	// Ordenar resultados según configuración
	const sortResults = (results: SearchResult[]) => {
		return results.sort((a, b) => {
			// Si hay búsqueda, mantener prioridad de coincidencias en nombre
			if (filter) {
				if (a.matchesName && !b.matchesName) return -1;
				if (!a.matchesName && b.matchesName) return 1;
			}
			
			// Aplicar orden configurado
			let comparison = 0;
			
			switch(config.sortBy) {
				case 'name':
					// Usar ordenamiento natural para nombres
					comparison = this.naturalCompare(a.file.basename, b.file.basename);
					break;
				case 'date':
					comparison = a.file.stat.mtime - b.file.stat.mtime;
					break;
				default:
					comparison = this.naturalCompare(a.file.basename, b.file.basename);
			}
			
			// Aplicar orden ascendente o descendente
			return config.sortOrder === 'asc' ? comparison : -comparison;
		});
	};

	results = sortResults(results);
    
    this.renderResults(results, list, filter, config);
    
    // Actualizar contador
    if (results.length === 0) {
        if (filter) {
            resultsCounter.textContent = 'No matches found';
        } else if (emojiFilter) {
            resultsCounter.textContent = `No notes with emoji ${emojiFilter}`;
        } else {
            resultsCounter.textContent = 'Start typing to search';
        }
    } else {
        if (emojiFilter && !filter) {
            resultsCounter.textContent = `${results.length} ${results.length === 1 ? 'note' : 'notes'} with emoji ${emojiFilter}`;
        } else {
            resultsCounter.textContent = `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
        }
    }
};
	
	input.addEventListener('input', (e) => {
		const target = e.target as HTMLInputElement;
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		searchTimeout = setTimeout(() => {
			performSearch(target.value, emojiSelect.value);
		}, 300);
	});
	
	emojiSelect.addEventListener('change', (e) => {
		const target = e.target as HTMLSelectElement;
		performSearch(input.value, target.value);
	});
	
	const updateEventHandler = async () => {
		if (this.app.workspace.getActiveFile()?.path === currentPath) {
			// Recargar emojis y mantener selección si es posible
			await loadAllEmojis();
			
			// Solo actualizar la búsqueda si hay texto o emoji seleccionado
			if (currentSearchText || selectedEmoji) {
				performSearch(currentSearchText, selectedEmoji);
			} else {
				// Si no hay filtros, solo mostrar backlinks
				performSearch('', '');
			}
		}
	};
	
	this.registerEvent(this.app.vault.on('create', updateEventHandler));
	this.registerEvent(this.app.vault.on('delete', updateEventHandler));
	this.registerEvent(this.app.vault.on('rename', updateEventHandler));
	this.registerEvent(this.app.vault.on('modify', updateEventHandler));
	this.registerEvent(this.app.workspace.on('file-open', updateEventHandler));
	
	// Cargar todos los emojis disponibles inicialmente
	await loadAllEmojis();
	// Realizar búsqueda inicial
	performSearch('', '');
	
	(wrapper as any)._searchFunction = performSearch;
	(wrapper as any)._currentSearchText = currentSearchText;
	(wrapper as any)._selectedEmoji = selectedEmoji;
}
	
private renderResults(results: SearchResult[], listElement: HTMLUListElement, filter: string, config: BlockConfig) {
	listElement.innerHTML = '';
	
	if (results.length === 0) {
		// SOLO MOSTRAR MENSAJE EN LA LISTA CUANDO HAY BÚSQUEDA
		if (filter) {
			const emptyMsg = document.createElement('li');
			emptyMsg.textContent = 'No matches found';
			emptyMsg.className = 'dynamic-note-creator-empty';
			listElement.appendChild(emptyMsg);
		}
		// Si no hay filter (búsqueda vacía), mostrar backlinks o mensaje
		return;
	}
	
	// Si hay resultados, mostrarlos
	results.forEach(result => {
		this.addNoteToList(result.file, listElement, filter, config, 
			result.content, result.matchesContent, result.isBacklink);
	});
}
	
private addNoteToList(file: any, list: HTMLUListElement, filter: string, config: BlockConfig, 
				 content: string = '', matchesContent: boolean = false, isBacklink: boolean = false) {
	const item = document.createElement('li');
	item.className = 'dynamic-note-creator-item';
	
	const linkContainer = document.createElement('div');
	linkContainer.className = 'internal-link-container';
	
	const nativeLink = document.createElement('a');
	nativeLink.className = 'internal-link dynamic-note-creator-link';
	nativeLink.textContent = file.basename;
	nativeLink.setAttribute('href', file.path);
	nativeLink.setAttribute('data-href', file.path);
	nativeLink.setAttribute('data-tooltip-position', 'top');
	
	// Añadir indicador de backlink
	if (isBacklink) {
		const backlinkIndicator = document.createElement('span');
		backlinkIndicator.textContent = ' 🔗';
		backlinkIndicator.style.opacity = '0.7';
		backlinkIndicator.style.fontSize = '0.9em';
		nativeLink.appendChild(backlinkIndicator);
	}
	
	// Prevenir la propagación del evento para que Obsidian no lo procese dos veces
	nativeLink.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		
		const openInNewPane = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
		this.app.workspace.openLinkText(file.path, '', openInNewPane);
	}, { capture: true, once: false }); // Usar capture para interceptar antes que Obsidian
	
	linkContainer.appendChild(nativeLink);
	item.appendChild(linkContainer);
	
	if (matchesContent && content && filter) {
		const contentNormalized = this.normalizeText(content);
		const idx = contentNormalized.indexOf(filter);
		
		if (idx !== -1) {
			const start = Math.max(0, idx - 60);
			const end = Math.min(contentNormalized.length, idx + filter.length + 60);
			const originalStart = Math.max(0, start - 20);
			const originalEnd = Math.min(content.length, idx + filter.length * 2 + 80);
			
			let snippet = content.slice(originalStart, originalEnd).replace(/\n/g, ' ');
			snippet = this.highlightTextImproved(snippet, filter);
			
			const preview = document.createElement('div');
			preview.className = 'dynamic-note-creator-preview';
			preview.innerHTML = '… ' + snippet + ' …';
			
			item.appendChild(preview);
		}
	}
	
	list.appendChild(item);
}

private containsLinkToNote(content: string, noteTitle: string): boolean {
	if (!noteTitle) return false;
	
	const pattern = new RegExp(`\\[\\[${this.escapeRegex(noteTitle)}(?:\\|[^\\]]*)?\\]\\]`, 'i');
	return pattern.test(content);
}
	
	private highlightTextImproved(text: string, query: string): string {
		if (!text || !query) return text;
		
		const normalizedText = this.normalizeText(text);
		const normalizedQuery = this.normalizeText(query);
		
		const regex = new RegExp(this.escapeRegex(normalizedQuery), 'gi');
		let result = text;
		let match;
		let offset = 0;
		
		while ((match = regex.exec(normalizedText)) !== null) {
			const searchStart = Math.max(0, match.index - offset - 10);
			const searchEnd = Math.min(text.length, match.index - offset + normalizedQuery.length + 10);
			
			const originalSegment = text.slice(searchStart, searchEnd);
			const normalizedSegment = this.normalizeText(originalSegment);
			
			const segmentMatch = normalizedSegment.indexOf(normalizedQuery);
			if (segmentMatch !== -1) {
				const actualStart = searchStart + segmentMatch;
				const actualEnd = actualStart + normalizedQuery.length;
				
				result = result.slice(0, actualStart) + 
						'<strong>' + text.slice(actualStart, actualEnd) + '</strong>' + 
						result.slice(actualEnd);
				
				offset += 15;
			}
		}
		
		return result;
	}
	
	private escapeRegex(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	
private parseConfig(source: string, blockPath?: string): BlockConfig {
    const config: BlockConfig = {};
    const lines = source.split('\n');
    
    let currentItem: Partial<PluginConfigItem> = {};
    let processingItems = false;
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return; // Ignorar líneas vacías
        
        // Detectar separador de items
        if (line === '---') {
            if (Object.keys(currentItem).length > 0) {
                // Guardar item actual
                if (!config.configItems) {
                    config.configItems = [];
                }
                config.configItems.push(currentItem as PluginConfigItem);
                currentItem = {};
            }
            processingItems = true;
            return;
        }
        
        // Parsear key: value
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            
            if (!processingItems) {
                // Propiedades globales
                switch(key) {
                    case 'title':
                        config[key] = value;
                        break;
                    case 'sortBy':
                        if (value === 'name' || value === 'date') {
                            config.sortBy = value;
                        }
                        break;
                    case 'sortOrder':
                        if (value === 'asc' || value === 'desc') {
                            config.sortOrder = value;
                        }
                        break;
                }
            } else {
                // Propiedades de items
                switch(key) {
                    case 'path':
                        // Si el valor es "current", usar la carpeta del bloque actual
                        if (value.toLowerCase() === 'current') {
                            // Obtener la carpeta del bloque
                            if (blockPath) {
                                const lastSlash = blockPath.lastIndexOf('/');
                                if (lastSlash > 0) {
                                    currentItem.path = blockPath.substring(0, lastSlash + 1);
                                } else {
                                    currentItem.path = '';
                                }
                            } else {
                                currentItem.path = '';
                            }
                            console.log('Path "current" resolved to:', currentItem.path);
                        } else {
                            currentItem.path = value.endsWith('/') ? value : value + '/';
                        }
                        break;
                    case 'nameButton':
                        currentItem.nameButton = value;
                        break;
                    case 'colorButton':
                        currentItem.colorButton = value;
                        break;
                    case 'backgroundButton':
                        currentItem.backgroundButton = value;
                        break;
                    case 'emoji':
                        currentItem.emoji = value;
                        break;
                    case 'pathTemplate':
                        currentItem.pathTemplate = value;
                        break;
                }
            }
        }
    });
    
    // Guardar el último item si existe
    if (Object.keys(currentItem).length > 0) {
        if (!config.configItems) {
            config.configItems = [];
        }
        config.configItems.push(currentItem as PluginConfigItem);
    }
    
    // Si no hay items configurados, usar los de settings
    if (!config.configItems || config.configItems.length === 0) {
        config.configItems = this.settings.configItems;
    }
    
    // Valores por defecto para ordenamiento
    if (!config.sortBy) {
        config.sortBy = 'name'; // Por defecto ordenar por nombre
    }
    if (!config.sortOrder) {
        config.sortOrder = 'asc'; // Por defecto ascendente
    }
    
    // Procesar paths "current" para items de settings también
    if (config.configItems && config.configItems.length > 0) {
        config.configItems = config.configItems.map(item => {
            if (item && item.path) {
                if (typeof item.path === 'string' && item.path.toLowerCase() === 'current') {
                    if (blockPath) {
                        const lastSlash = blockPath.lastIndexOf('/');
                        if (lastSlash > 0) {
                            return {
                                ...item,
                                path: blockPath.substring(0, lastSlash + 1)
                            };
                        } else {
                            return {
                                ...item,
                                path: ''
                            };
                        }
                    }
                }
            }
            return item;
        });
    }
    
    console.log('Final config:', {
        title: config.title,
        sortBy: config.sortBy,
        sortOrder: config.sortOrder,
        items: config.configItems?.map(item => ({
            name: item.nameButton,
            path: item.path
        }))
    });
    
    return config;
}
	
	private showCreateNotePopup(configItem: PluginConfigItem, blockConfig: BlockConfig, onSuccess?: () => void) {
		this.modal = new CreateNoteModal(this.app, this, configItem, blockConfig, onSuccess);
		this.modal.open();
	}
	
public async createNote(noteName: string, configItem: PluginConfigItem, blockConfig: BlockConfig) {
	console.log('=== DYNAMIC NOTE CREATOR - CREATE NOTE ===');
	console.log('Note:', noteName);
	console.log('Config Item:', configItem);
	
	const fileName = noteName.endsWith('.md') ? noteName : `${noteName}.md`;
	const basePath = configItem.path;
	const fullPath = `${basePath}${fileName}`;
	
	console.log('Full path:', fullPath);
	
	let content = '';
	let templateApplied = false;
	let templateHasTemplaterCode = false;
	
	// Aplicar plantilla (código existente...)
	const templatePath = configItem.pathTemplate;
	
	if (templatePath && templatePath.trim()) {
		try {
			console.log('Looking for template:', templatePath);
			
			let templateFile = null;
			let pathsToTry = [];
			
			if (!templatePath.includes('.')) {
				pathsToTry = [templatePath + '.md', templatePath];
			} else {
				pathsToTry = [templatePath];
			}
			
			console.log('Paths to try:', pathsToTry);
			
			for (const path of pathsToTry) {
				templateFile = this.app.vault.getAbstractFileByPath(path);
				if (templateFile) {
					console.log('Template found at:', path);
					break;
				}
			}
			
			if (templateFile && this.isValidMarkdownFile(templateFile)) {
				console.log('Template is valid');
				
				const templateContent = await this.app.vault.read(templateFile);
				console.log('Template content length:', templateContent.length);
				
				if (templateContent.trim() !== '') {
					templateApplied = true;
					content = templateContent;
					templateHasTemplaterCode = templateContent.includes('<%') && 
											templateContent.includes('%>');
					
					console.log('Template analysis:', {
						hasTemplaterCode: templateHasTemplaterCode,
						length: templateContent.length
					});
				} else {
					console.log('Template is empty - creating empty file');
					content = '';
				}
			} else {
				console.log('Template not found or invalid');
			}
		} catch (error: any) {
			console.error('Error loading template:', error);
		}
	} else {
		console.log('No template configured - creating empty file');
	}
	
	if (!templateApplied) {
		content = '';
	}
	
	console.log('Initial content:', `"${content}"`);
	console.log('Template applied:', templateApplied);
	
	try {
		const dirPath = basePath.replace(/\/$/, '');
		console.log('Directory to create/verify:', dirPath);
		
		const dirExists = await this.app.vault.adapter.exists(dirPath);
		console.log('Directory exists?', dirExists);
		
		if (!dirExists) {
			console.log('Creating directory:', dirPath);
			await this.app.vault.createFolder(dirPath);
		}
		
		console.log('Creating file:', fullPath);
		
		// Crear el archivo
		const file = await this.app.vault.create(fullPath, content);
		console.log('File created successfully!');
		
		// Procesar con Templater (código existente...)
		const templaterPlugin = (this.app as any).plugins.plugins['templater-obsidian'];
		
		if (templateApplied && templateHasTemplaterCode && templaterPlugin && templaterPlugin.templater) {
			console.log('Processing with Templater...');
			
			try {
				const templaterContext = {
					template_file: file,
					target_file: file,
					run_mode: 4,
					creation_date: new Date(),
					title: noteName,
					noteName: noteName,
					tp: {
						file: {
							title: noteName,
							path: file.path,
							basename: file.basename,
							name: file.name
						},
						date: {
							now: this.formatDateNow(),
							today: this.formatDateToday()
						}
					}
				};
				
				if (typeof templaterPlugin.templater.parse_template_into_file === 'function') {
					await templaterPlugin.templater.parse_template_into_file(templaterContext, file);
				} else if (typeof templaterPlugin.templater.parse_and_save_to_file === 'function') {
					await templaterPlugin.templater.parse_and_save_to_file(templaterContext, file);
				} else if (typeof templaterPlugin.templater.parse_template === 'function') {
					const currentContent = await this.app.vault.read(file);
					const parsedContent = await templaterPlugin.templater.parse_template(
						templaterContext,
						currentContent
					);
					
					if (parsedContent !== currentContent) {
						await this.app.vault.modify(file, parsedContent);
					}
				}
				
				console.log('Templater processing complete');
				
			} catch (templaterError: any) {
				console.error('Templater processing failed:', templaterError);
			}
		} else {
			console.log('Skipping Templater:', {
				templateApplied,
				hasTemplaterCode: templateHasTemplaterCode,
				templaterAvailable: !!(templaterPlugin && templaterPlugin.templater)
			});
		}
		
		console.log('Final content:', (await this.app.vault.read(file)).substring(0, 500));
		
		// 🔥 CAMBIO IMPORTANTE AQUÍ 🔥
		// Usar 'tab' para comportamiento consistente en todas las plataformas
		const leaf = this.app.workspace.getLeaf('tab');
		await leaf.openFile(file);
		
		// Posicionar cursor
		setTimeout(() => {
			this.positionCursorAtEnd(leaf);
		}, 100);
		
	} catch (error: any) {
		console.error('Final error creating note:', error);
		new Notice(`Error creating note: ${error.message}`);
	}
	
	console.log('=== END CREATE NOTE ===');
}

// NUEVO MÉTODO: Posicionar cursor al final
private async positionCursorAtEnd(leaf: any) {
    try {
        const view = leaf.view;
        if (!view || !view.editor || !view.file) return;

        const editor = view.editor;
        const file = view.file;

        let content = await this.app.vault.read(file);

        // 👉 GARANTIZAR AL MENOS UNA LÍNEA VACÍA AL FINAL
        if (!content.endsWith("\n\n")) {
            content = content + "\n\n";
            await this.app.vault.modify(file, content);
        }

        // (Opcional) si quieres DOS líneas extra, usa:
        // content = content + "\n";

        const lines = content.split("\n");
        const cursorPos = {
            line: lines.length - 1, // última línea vacía real
            ch: 0
        };

        editor.setCursor(cursorPos);
        editor.scrollIntoView({ from: cursorPos, to: cursorPos });

        console.log("Cursor positioned:", cursorPos);
    } catch (error) {
        console.error("Error positioning cursor:", error);
    }
}

/**
 * Comparador natural para ordenar strings que contienen números
 * Reconoce y ordena correctamente números dentro de textos
 * 
 * Ejemplos:
 * - "1", "2", "10" → 1, 2, 10 (no 1, 10, 2)
 * - "capítulo 1", "capítulo 2", "capítulo 10" → orden correcto
 * - "item-1", "item-2", "item-10" → orden correcto
 * 
 * @param a - Primer string a comparar
 * @param b - Segundo string a comparar
 * @returns Número negativo si a < b, positivo si a > b, 0 si son iguales
 */
private naturalCompare(a: string, b: string): number {
    // Opción 1: Usando localeCompare (recomendada por su simplicidad)
    // return a.localeCompare(b, undefined, {
    //     numeric: true,      // Trata los números como números, no como texto
    //     sensitivity: 'base' // Ignora diferencias entre mayúsculas/minúsculas
    // });
    
    // Opción 2: Implementación manual (más control pero más código)
    const regex = /(\d+)|(\D+)/g;
    const aParts = a.match(regex) || [];
    const bParts = b.match(regex) || [];
    
    const maxLength = Math.max(aParts.length, bParts.length);
    
    for (let i = 0; i < maxLength; i++) {
        if (i >= aParts.length) return -1;
        if (i >= bParts.length) return 1;
        
        const aPart = aParts[i];
        const bPart = bParts[i];
        
        const aIsNum = /^\d+$/.test(aPart);
        const bIsNum = /^\d+$/.test(bPart);
        
        if (aIsNum && bIsNum) {
            const aNum = parseInt(aPart, 10);
            const bNum = parseInt(bPart, 10);
            if (aNum !== bNum) return aNum - bNum;
        } else {
            const textCompare = aPart.localeCompare(bPart);
            if (textCompare !== 0) return textCompare;
        }
    }
    
    return 0;
    
}



// Métodos auxiliares para formato de fecha
private formatDateNow(): string {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const year = now.getFullYear();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	return `${day}/${month}/${year} ${hours}:${minutes}`;
}

private formatDateToday(): string {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const year = now.getFullYear();
	return `${day}/${month}/${year}`;
}
	
	private isValidMarkdownFile(file: any): boolean {
		try {
			if (!file) return false;
			
			const hasPath = typeof file.path === 'string';
			const hasName = typeof file.name === 'string';
			const hasExtension = typeof file.extension === 'string';
			
			if (!hasPath || !hasName || !hasExtension) return false;
			
			const isMarkdown = file.extension === 'md' || file.name.endsWith('.md');
			return isMarkdown;
		} catch (error) {
			console.error('Error in isValidMarkdownFile:', error);
			return false;
		}
	}
	
private processTemplate(template: string, variables: {[key: string]: any}): string {
	console.log('Processing template with variables:', Object.keys(variables));
	
	let processed = template;
	
	// Primero intentar reemplazar variables básicas
	Object.keys(variables).forEach(key => {
		const value = variables[key];
		if (value !== undefined && value !== null) {
			const formats = [
				`{{${key}}}`,
				`{{ ${key} }}`,
				`{{${key} }}`,
				`{{ ${key}}}`
			];
			
			formats.forEach(format => {
				const regex = new RegExp(this.escapeRegex(format), 'g');
				const matches = processed.match(regex);
				
				if (matches && matches.length > 0) {
					console.log(`Replacing "${format}" (${matches.length} times) with:`, value);
					processed = processed.replace(regex, String(value));
				}
			});
		}
	});
	
	// También reemplazar variables anidadas (tp.file.title, etc.)
	if (variables.tp) {
		Object.keys(variables.tp).forEach(sectionKey => {
			const section = variables.tp[sectionKey];
			if (typeof section === 'object') {
				Object.keys(section).forEach(subKey => {
					const value = section[subKey];
					const formats = [
						`<% tp.${sectionKey}.${subKey} %>`,
						`<%tp.${sectionKey}.${subKey}%>`,
						`{{tp.${sectionKey}.${subKey}}}`,
						`{{ tp.${sectionKey}.${subKey} }}`
					];
					
					formats.forEach(format => {
						const regex = new RegExp(this.escapeRegex(format), 'g');
						const matches = processed.match(regex);
						
						if (matches && matches.length > 0) {
							console.log(`Replacing "${format}" with:`, value);
							processed = processed.replace(regex, String(value));
						}
					});
				});
			}
		});
	}
	
	return processed;
}


	
	onunload() {
		console.log('Unloading Dynamic Note Creator Plugin');
	}
}

class CreateNoteModal extends Modal {
	private plugin: DynamicNoteCreator;
	private configItem: PluginConfigItem;
	private blockConfig: BlockConfig;
	private onSuccess?: () => void;
	
	constructor(app: App, plugin: DynamicNoteCreator, configItem: PluginConfigItem, blockConfig: BlockConfig, onSuccess?: () => void) {
		super(app);
		this.plugin = plugin;
		this.configItem = configItem;
		this.blockConfig = blockConfig;
		this.onSuccess = onSuccess;
	}
	
onOpen() {
	const {contentEl} = this;
	contentEl.empty();
	contentEl.addClass('dynamic-note-creator-modal');
	
	const modalContent = document.createElement('div');
	modalContent.className = 'dynamic-note-creator-modal-content';
	
	const titleInput = document.createElement('input');
	titleInput.type = 'text';
	titleInput.placeholder = 'Note name';
	titleInput.className = 'dynamic-note-creator-modal-input';
	
	// Añadir emoji al valor inicial si está configurado
	let initialValue = '';
	if (this.configItem.emoji && this.configItem.emoji !== 'false' && this.configItem.emoji !== 'true') {
		initialValue = `${this.configItem.emoji} `;
	}
	titleInput.value = initialValue;
	
	const buttonRow = document.createElement('div');
	buttonRow.className = 'dynamic-note-creator-modal-buttons';
	
	const cancelBtn = document.createElement('button');
	cancelBtn.textContent = 'Cancel';
	cancelBtn.className = 'dynamic-note-creator-modal-cancel';
	
	const createBtn = document.createElement('button');
	createBtn.textContent = 'Create';
	createBtn.className = 'dynamic-note-creator-modal-create';
	
	buttonRow.appendChild(cancelBtn);
	buttonRow.appendChild(createBtn);
	
	modalContent.appendChild(titleInput);
	modalContent.appendChild(buttonRow);
	contentEl.appendChild(modalContent);
	
	// Colocar el cursor después del emoji
	setTimeout(() => {
		titleInput.focus();
		// Si hay emoji, colocar el cursor después
		if (this.configItem.emoji && this.configItem.emoji !== 'false' && this.configItem.emoji !== 'true') {
			const emojiLength = this.configItem.emoji.length + 1; // +1 para el espacio
			titleInput.setSelectionRange(emojiLength, emojiLength);
		}
	}, 100);
	
	const createNoteAndClose = async () => {
		let noteName = titleInput.value.trim();
		
		// Eliminar espacios extras pero mantener el emoji si existe
		if (noteName) {
			await this.plugin.createNote(noteName, this.configItem, this.blockConfig);
			this.close();
			new Notice(`Note "${noteName}" created`);
			
			if (this.onSuccess) {
				setTimeout(this.onSuccess, 500);
			}
		}
	};
	
	cancelBtn.addEventListener('click', () => this.close());
	createBtn.addEventListener('click', createNoteAndClose);
	
	titleInput.addEventListener('keypress', async (e) => {
		if (e.key === 'Enter') {
			await createNoteAndClose();
		}
	});
}
	
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class DynamicNoteCreatorSettingTab extends PluginSettingTab {
	plugin: DynamicNoteCreator;
	
	constructor(app: App, plugin: DynamicNoteCreator) {
		super(app, plugin);
		this.plugin = plugin;
	}
	
	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		
		containerEl.createEl('h2', {text: 'Dynamic Note Creator Settings'});
		
		new Setting(containerEl)
			.setName('Default Title')
			.setDesc('Text displayed as the search block title')
			.addText(text => text
				.setPlaceholder('Search:')
				.setValue(this.plugin.settings.title)
				.onChange(async (value) => {
					this.plugin.settings.title = value;
					await this.plugin.saveSettings();
				}));
		
		// Configuración para múltiples items
		containerEl.createEl('h3', {text: 'Configuration Items'});
		containerEl.createEl('p', {
			text: 'Add multiple configurations for different note types. Each item creates a separate button.',
			cls: 'setting-item-description'
		});
		
		this.renderConfigItems(containerEl);
		
		const addButton = containerEl.createEl('button', {
			text: '+ Add Configuration Item',
			cls: 'dynamic-note-creator-add-button'
		});
		
		addButton.addEventListener('click', () => {
			this.plugin.settings.configItems.push({
				path: 'Notes/',
				nameButton: '➕ Add Note',
				colorButton: '#ffffff',
				backgroundButton: '#814ae8',
				emoji: '📝',
				pathTemplate: 'templates/default.md'
			});
			this.plugin.saveSettings();
			this.display();
		});
		
		// Example block
		containerEl.createEl('h3', {text: 'Example Configuration'});
		
		const exampleEl = containerEl.createEl('div', { cls: 'dynamic-note-creator-example' });
		const exampleCode = exampleEl.createEl('pre');
		exampleCode.createEl('code', { 
			text: `\`\`\`dynamicsearch
title: Search:
path: Notes/, Projects/, Ideas/
nameButton: ➕ Note, ➕ Project, ➕ Idea
colorButton: #ffffff, #ffffff, #ffffff
backgroundButton: #814ae8, #4a86e8, #e87c4a
emoji: 📝, 🚀, 💡
pathTemplate: templates/note.md, templates/project.md, templates/idea.md
\`\`\`` 
		});
	}
	
	private renderConfigItems(containerEl: HTMLElement) {
		this.plugin.settings.configItems.forEach((item, index) => {
			const itemContainer = containerEl.createEl('div', {
				cls: 'dynamic-note-creator-item-container'
			});
			
			itemContainer.createEl('h4', { text: `Configuration ${index + 1}` });
			
			new Setting(itemContainer)
				.setName('Path')
				.setDesc('Folder where notes will be saved. Use "current" to save in the same folder as the block.')
				.addText(text => text
					.setPlaceholder('Notes/ or "current"')
					.setValue(item.path)
					.onChange(async (value) => {
						// Si el valor es "current", guardarlo exactamente así
						if (value.toLowerCase() === 'current') {
							this.plugin.settings.configItems[index].path = 'current';
						} else {
							this.plugin.settings.configItems[index].path = value.endsWith('/') ? value : value + '/';
						}
						await this.plugin.saveSettings();
					}));
			
			new Setting(itemContainer)
				.setName('Button Text')
				.setDesc('Text displayed on the button')
				.addText(text => text
					.setPlaceholder('➕ Add Note')
					.setValue(item.nameButton)
					.onChange(async (value) => {
						this.plugin.settings.configItems[index].nameButton = value;
						await this.plugin.saveSettings();
					}));
			
			new Setting(itemContainer)
				.setName('Button Text Color')
				.setDesc('Hexadecimal color for button text')
				.addText(text => text
					.setPlaceholder('#ffffff')
					.setValue(item.colorButton)
					.onChange(async (value) => {
						this.plugin.settings.configItems[index].colorButton = value;
						await this.plugin.saveSettings();
					}));
			
			new Setting(itemContainer)
				.setName('Button Background Color')
				.setDesc('Hexadecimal color for button background')
				.addText(text => text
					.setPlaceholder('#814ae8')
					.setValue(item.backgroundButton)
					.onChange(async (value) => {
						this.plugin.settings.configItems[index].backgroundButton = value;
						await this.plugin.saveSettings();
					}));
			
			new Setting(itemContainer)
				.setName('Emoji')
				.setDesc('Emoji prefix for new notes (optional)')
				.addText(text => text
					.setPlaceholder('📝')
					.setValue(item.emoji || '')
					.onChange(async (value) => {
						this.plugin.settings.configItems[index].emoji = value;
						await this.plugin.saveSettings();
					}));
			
			new Setting(itemContainer)
				.setName('Template Path')
				.setDesc('Path to template file')
				.addText(text => text
					.setPlaceholder('templates/default.md')
					.setValue(item.pathTemplate)
					.onChange(async (value) => {
						this.plugin.settings.configItems[index].pathTemplate = value;
						await this.plugin.saveSettings();
					}));
			
			// Botón para eliminar item
			if (index > 0) {
				const deleteButton = itemContainer.createEl('button', {
					text: 'Remove Configuration',
					cls: 'dynamic-note-creator-remove-button'
				});
				
				deleteButton.addEventListener('click', async () => {
					this.plugin.settings.configItems.splice(index, 1);
					await this.plugin.saveSettings();
					this.display();
				});
			}
			
			itemContainer.createEl('hr');
		});
	}


	
}