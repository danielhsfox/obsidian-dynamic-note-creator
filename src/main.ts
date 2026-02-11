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
		
		// Crear el contenido del bloque con múltiples configuraciones
		const blockLines = ['```dynamicsearch', `title: ${this.settings.title}`];
		
		// Añadir cada configuración como lista separada por comas
		if (this.settings.configItems.length > 0) {
			blockLines.push(`path: ${this.settings.configItems.map(item => item.path).join(', ')}`);
			blockLines.push(`nameButton: ${this.settings.configItems.map(item => item.nameButton).join(', ')}`);
			blockLines.push(`colorButton: ${this.settings.configItems.map(item => item.colorButton).join(', ')}`);
			blockLines.push(`backgroundButton: ${this.settings.configItems.map(item => item.backgroundButton).join(', ')}`);
			blockLines.push(`emoji: ${this.settings.configItems.map(item => item.emoji || '').join(', ')}`);
			blockLines.push(`pathTemplate: ${this.settings.configItems.map(item => item.pathTemplate).join(', ')}`);
		}
		
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
		
		const config = this.parseConfig(source);
		
		const wrapper = document.createElement('div');
		wrapper.className = 'dynamic-note-creator-wrapper';
		
		// Fila superior con título
		const topRow = document.createElement('div');
		topRow.className = 'dynamic-note-creator-top-row';
		
		const label = document.createElement('label');
		label.textContent = config.title || this.settings.title;
		
		// Contenedor para label + botones
		const rightContainer = document.createElement('div');
		rightContainer.style.display = 'flex';
		rightContainer.style.gap = '10px';
		rightContainer.style.alignItems = 'center';

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
						performSearch(currentSearchText);
					});
				});
				
				buttonsContainer.appendChild(button);
			});
		}
		rightContainer.appendChild(buttonsContainer);
		topRow.appendChild(label);
		topRow.appendChild(rightContainer); // Ahora esto contiene los botones alineados a la derecha
		
		topRow.appendChild(buttonsContainer);
		
		// Input de búsqueda
		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = 'Search notes...';
		input.className = 'dynamic-note-creator-input';
		
		// Contador de resultados
		const resultsCounter = document.createElement('div');
		resultsCounter.className = 'dynamic-note-creator-counter';
		
		// Lista de resultados
		const list = document.createElement('ul');
		list.className = 'dynamic-note-creator-list';
		
		wrapper.appendChild(topRow);
		wrapper.appendChild(input);
		wrapper.appendChild(resultsCounter);
		wrapper.appendChild(list);
		container.appendChild(wrapper);
		
		const currentFile = this.app.workspace.getActiveFile();
		const currentPath = currentFile ? currentFile.path : '';
		
		let currentSearchText = '';
		let searchTimeout: NodeJS.Timeout | null = null;
		
const performSearch = async (searchText: string) => {
	currentSearchText = searchText;
	
	list.innerHTML = '';
	resultsCounter.textContent = 'Searching...';
	
	const filter = this.normalizeText(searchText.trim());
	const files = this.app.vault.getMarkdownFiles();
	
	let results: SearchResult[] = [];
	
	if (filter) {
		// Búsqueda con texto
		const allPaths = config.configItems?.map(item => item.path) || [this.settings.configItems[0]?.path || ''];
		
		for (const file of files) {
			try {
				// Verificar si el archivo está en alguno de los paths configurados
				const isInPath = allPaths.some(path => file.path.startsWith(path));
				const isNotCurrent = file.path !== currentPath;
				
				if (isInPath && isNotCurrent) {
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
	} else {
		// Búsqueda vacía - mostrar notas que enlazan a la actual
		const allPaths = config.configItems?.map(item => item.path) || [this.settings.configItems[0]?.path || ''];
		const currentTitle = this.app.workspace.getActiveFile()?.basename || '';
		
		for (const file of files) {
			try {
				const isInPath = allPaths.some(path => file.path.startsWith(path));
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
	
	this.renderResults(results, list, filter, config);
	
	// Actualizar contador
	if (results.length === 0) {
		if (filter) {
			resultsCounter.textContent = 'No matches found';
		} else {
			resultsCounter.textContent = 'Start typing to search';
		}
	} else {
		resultsCounter.textContent = `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
	}
};
		
		input.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
			
			searchTimeout = setTimeout(() => {
				performSearch(target.value);
			}, 300);
		});
		
		const updateEventHandler = () => {
			if (this.app.workspace.getActiveFile()?.path === currentPath) {
				performSearch(currentSearchText);
			}
		};
		
		this.registerEvent(this.app.vault.on('create', updateEventHandler));
		this.registerEvent(this.app.vault.on('delete', updateEventHandler));
		this.registerEvent(this.app.vault.on('rename', updateEventHandler));
		this.registerEvent(this.app.vault.on('modify', updateEventHandler));
		this.registerEvent(this.app.workspace.on('file-open', updateEventHandler));
		
		performSearch('');
		
		(wrapper as any)._searchFunction = performSearch;
		(wrapper as any)._currentSearchText = currentSearchText;
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
	
	nativeLink.addEventListener('click', (e) => {
		const openInNewPane = e.ctrlKey || e.metaKey || e.shiftKey;
		this.app.workspace.openLinkText(file.path, '', openInNewPane);
	});
	
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
	
private parseConfig(source: string): BlockConfig {
	const config: BlockConfig = {};
	const lines = source.split('\n');
	
	lines.forEach(line => {
		const match = line.match(/^(\w+):\s*(.+)$/);
		if (match) {
			const key = match[1].trim() as keyof BlockConfig;
			const value = match[2].trim();
			
			if (key === 'title') {
				config[key] = value;
			} else {
				// Parsear listas separadas por comas
				const items = value.split(',').map(item => item.trim()).filter(item => item);
				
				if (!config.configItems) {
					config.configItems = [];
				}
				
				// Asegurar que haya suficiente espacio en el array
				items.forEach((item, index) => {
					if (!config.configItems![index]) {
						config.configItems![index] = {
							path: '',
							nameButton: '',
							colorButton: '',
							backgroundButton: '',
							pathTemplate: ''
						};
					}
					
					switch(key) {
						case 'path':
							config.configItems![index].path = item.endsWith('/') ? item : item + '/';
							break;
						case 'nameButton':
							config.configItems![index].nameButton = item;
							break;
						case 'colorButton':
							config.configItems![index].colorButton = item;
							break;
						case 'backgroundButton':
							config.configItems![index].backgroundButton = item;
							break;
						case 'emoji':
							// Solo guardar el emoji real, no "true"/"false"
							if (item === 'true') {
								config.configItems![index].emoji = '📝'; // Emoji por defecto
							} else if (item === 'false') {
								config.configItems![index].emoji = '';
							} else {
								config.configItems![index].emoji = item;
							}
							break;
						case 'pathTemplate':
							config.configItems![index].pathTemplate = item;
							break;
					}
				});
			}
		}
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
	
	// Aplicar plantilla
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
				
				// Verificar si el template tiene contenido
				if (templateContent.trim() !== '') {
					templateApplied = true;
					content = templateContent;
					
					// Verificar si el template tiene código Templater
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
	
	// Si no hay template o está vacío, crear archivo vacío
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
		
		// 1. CREAR EL ARCHIVO CON CONTENIDO DEL TEMPLATE (o vacío)
		const file = await this.app.vault.create(fullPath, content);
		console.log('File created successfully!');
		
		// 2. PROCESAR CON TEMPLATER SOLO SI EL TEMPLATE TIENE CÓDIGO TEMPLATER
		const templaterPlugin = (this.app as any).plugins.plugins['templater-obsidian'];
		
		if (templateApplied && templateHasTemplaterCode && templaterPlugin && templaterPlugin.templater) {
			console.log('Processing with Templater...');
			
			try {
				// Crear contexto para Templater
				const templaterContext = {
					template_file: file,
					target_file: file,
					run_mode: 4,
					creation_date: new Date(),
					// Variables para el template
					title: noteName,
					noteName: noteName,
					// Para compatibilidad con tp
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
				
				// Procesar con Templater
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
		
		// 3. ABRIR LA NUEVA NOTA
		// 3. ABRIR LA NUEVA NOTA Y POSICIONAR CURSOR
		const leaf = this.app.workspace.getLeaf(true);
		await leaf.openFile(file);
		
		// Esperar a que el editor esté listo
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
				.setDesc('Folder where notes will be saved')
				.addText(text => text
					.setPlaceholder('Notes/')
					.setValue(item.path)
					.onChange(async (value) => {
						this.plugin.settings.configItems[index].path = value.endsWith('/') ? value : value + '/';
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