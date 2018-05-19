/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { GroupIdentifier, IWorkbenchEditorConfiguration, IWorkbenchEditorPartConfiguration, EditorOptions, TextEditorOptions, IEditorInput } from 'vs/workbench/common/editor';
import { EditorGroup } from 'vs/workbench/common/editor/editorGroup';
import { IEditorGroup, GroupDirection, IAddGroupOptions, IMergeGroupOptions } from 'vs/workbench/services/group/common/nextEditorGroupsService';
import { IDisposable } from 'vs/base/common/lifecycle';
import { Dimension } from 'vs/base/browser/dom';
import { Event } from 'vs/base/common/event';
import { assign } from 'vs/base/common/objects';
import { IConfigurationChangeEvent } from 'vs/platform/configuration/common/configuration';
import { ISerializableView } from 'vs/base/browser/ui/grid/grid';
import { getCodeEditor } from 'vs/editor/browser/editorBrowser';

export const EDITOR_TITLE_HEIGHT = 35;

export const EDITOR_MIN_DIMENSIONS = new Dimension(220, 70);
export const EDITOR_MAX_DIMENSIONS = new Dimension(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);

export interface IEditorPartOptions extends IWorkbenchEditorPartConfiguration {
	iconTheme?: string;
}

export const DEFAULT_EDITOR_PART_OPTIONS: IEditorPartOptions = {
	showTabs: true,
	tabCloseButton: 'right',
	tabSizing: 'fit',
	showIcons: true,
	enablePreview: true,
	labelFormat: 'default',
	iconTheme: 'vs-seti',
	revealIfOpen: false
};

export function impactsEditorPartOptions(event: IConfigurationChangeEvent): boolean {
	return event.affectsConfiguration('workbench.editor') || event.affectsConfiguration('workbench.iconTheme');
}

export function getEditorPartOptions(config: IWorkbenchEditorConfiguration): IEditorPartOptions {
	const options: IEditorPartOptions = assign(Object.create(null), DEFAULT_EDITOR_PART_OPTIONS);

	if (!config || !config.workbench) {
		return options;
	}

	if (typeof config.workbench.iconTheme === 'string') {
		options.iconTheme = config.workbench.iconTheme;
	}

	if (config.workbench.editor) {
		assign(options, config.workbench.editor);
	}

	return options;
}

export interface IEditorPartOptionsChangeEvent {
	oldPartOptions: IEditorPartOptions;
	newPartOptions: IEditorPartOptions;
}

export interface IEditorGroupsAccessor {
	readonly groups: IEditorGroupView[];
	readonly activeGroup: IEditorGroupView;

	readonly partOptions: IEditorPartOptions;
	readonly onDidEditorPartOptionsChange: Event<IEditorPartOptionsChangeEvent>;

	getGroup(identifier: GroupIdentifier): IEditorGroupView;

	activateGroup(identifier: IEditorGroupView | GroupIdentifier): IEditorGroupView;
	focusGroup(identifier: IEditorGroupView | GroupIdentifier): IEditorGroupView;

	addGroup(location: IEditorGroupView | GroupIdentifier, direction: GroupDirection, options?: IAddGroupOptions): IEditorGroupView;
	mergeGroup(group: IEditorGroupView | GroupIdentifier, target: IEditorGroupView | GroupIdentifier, options?: IMergeGroupOptions): IEditorGroupView;

	moveGroup(group: IEditorGroupView | GroupIdentifier, location: IEditorGroupView | GroupIdentifier, direction: GroupDirection): IEditorGroupView;
	copyGroup(group: IEditorGroupView | GroupIdentifier, location: IEditorGroupView | GroupIdentifier, direction: GroupDirection): IEditorGroupView;

	removeGroup(group: IEditorGroupView | GroupIdentifier): void;
}

export interface IEditorGroupView extends IDisposable, ISerializableView, IEditorGroup {
	readonly group: EditorGroup;
	readonly whenRestored: TPromise<void>;
	readonly disposed: boolean;

	readonly onDidFocus: Event<void>;
	readonly onWillDispose: Event<void>;

	isEmpty(): boolean;
	setActive(isActive: boolean): void;
	setLabel(label: string): void;

	shutdown(): void;
}

export function getActiveTextEditorOptions(group: IEditorGroup, expectedActiveEditor?: IEditorInput, presetOptions?: EditorOptions): EditorOptions {
	const activeGroupCodeEditor = group.activeControl ? getCodeEditor(group.activeControl.getControl()) : void 0;
	if (activeGroupCodeEditor) {
		if (!expectedActiveEditor || expectedActiveEditor.matches(group.activeEditor)) {
			return TextEditorOptions.fromEditor(activeGroupCodeEditor, presetOptions);
		}
	}

	return presetOptions || new EditorOptions();
}