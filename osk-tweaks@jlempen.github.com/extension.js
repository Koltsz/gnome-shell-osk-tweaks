// On-Screen Keyboard Tweaks
// Extension version 1 for GNOME Shell 3.28, 3.30 and 3.32
// Copyright (c) 2019 Jürg Lempen
// https://github.com/jlempen/gnome-shell-osk-tweaks
// Licensed under GPLv3

const { Gio, Shell, St } = imports.gi;

const A11Y_APPLICATIONS_SCHEMA = 'org.gnome.desktop.a11y.applications';
const SHOW_KEYBOARD = 'screen-keyboard-enabled';

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const Keyboard = imports.ui.keyboard;
const Layout = imports.ui.layout;
const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Utils = Me.imports.utils;

const IndicatorName = "OSKButtonIndicator";


let _indicator;
let _oskA11yApplicationsSettings;

let override_enabled;
let osk_layout;
let landscape_osk_height;
let landscape_osk_width;
let portrait_osk_height;
let portrait_osk_width;

let backup_relayout;
let backup_appendKey;
let backup_layoutButtons;
let backup_loadModel;
let backup_updateKeyboardBox;

let KeyboardIsSetup;


class OSKButton extends PanelMenu.Button {
    constructor() {
        super(0.0, IndicatorName);

        let icon = new St.Icon({ icon_name: 'input-keyboard-symbolic',
        style_class: 'system-status-icon' });
        this.actor.add_child(icon);

        this.actor.connect('button-press-event', _toggleKeyboardOnClick);
        this.actor.connect('touch-event', _toggleKeyboardOnTouch);

        this._settings = Utils.getSettings();
        this._settings.connect('changed::show', () => {
            this.actor.visible = this._settings.get_boolean('show');
        });

        this.actor.visible = this._settings.get_boolean('show');
    }

    destroy() {
        this.menu.removeAll();
        super.destroy();
    }
};


function _loadSettings() {
    this._settings = Utils.getSettings();

    // Override switch
    override_enabled = this._settings.get_boolean('override-switch');

    // OSK layout
    osk_layout = this._settings.get_string('layout');

    // OSK size settings
    landscape_osk_height = this._settings.get_int('landscape-height');
    landscape_osk_width = this._settings.get_string('landscape-width');
    portrait_osk_height = this._settings.get_int('portrait-height');
    portrait_osk_width = this._settings.get_string('portrait-width');
}


function _storeSettings() {
    _setDefaultValues();

    // Override switch
    this._settings.set_boolean('override-switch', override_enabled);

    // OSK layout
    this._settings.set_string('layout', osk_layout);

    // OSK size settings
    this._settings.set_int('landscape-height', landscape_osk_height);
    this._settings.set_string('landscape-width', landscape_osk_width);
    this._settings.set_int('portrait-height', portrait_osk_height);
    this._settings.set_string('portrait-width', portrait_osk_width);
}


function _setDefaultValues() {
    // Override switch
    override_enabled = false;

    // OSK layout
    osk_layout = 'us';

    // OSK size settings
    landscape_osk_height = 33;
    landscape_osk_width = 'Square (1:1)';
    portrait_osk_height = 33;
    portrait_osk_width = 'Square (1:1)';
}


function _destroyOSK() {
    Main.layoutManager.removeChrome(Main.layoutManager.keyboardBox);

    // Workaround borrowed from Simon Schumann. Thanks Simon!
    // https://github.com/schuhumi/gnome-shell-extension-improve-osk
    KeyboardIsSetup = true;
    try {
        Main.keyboard._destroyKeyboard();
    } catch (e) {
        if(e instanceof TypeError) {
            // In case the keyboard is currently disabled in accessability settings, attempting to _destroyKeyboard() yields a TypeError ("TypeError: this.actor is null")
            // This doesn't affect functionality, so proceed as usual. The only difference is that we do not automatically _setupKeyboard at the end of this enable() (let the user enable the keyboard in accessability settings)
            KeyboardIsSetup = false;
        } else {
            // Something else happened
            throw e;
        }
    }
}


function _setupOSK() {
    if(KeyboardIsSetup) {
        Main.keyboard._setupKeyboard();
    }
    // Resize the desktop when the OSK is shown
    // Code borrowed from Simon Schumann. Thanks Simon!
    // https://github.com/schuhumi/gnome-shell-extension-improve-osk
    Main.layoutManager.addChrome(Main.layoutManager.keyboardBox, { affectsStruts: true, trackFullscreen: false });
    // Main.layoutManager.addChrome(Main.layoutManager.keyboardBox);
}


// Handle the settings changes
function _settingsChangeHandler() {
    this._settings = Utils.getSettings();

    // Override switch
    this._settings.connect('changed::override-switch', () => {
        override_enabled = this._settings.get_boolean('override-switch');
        Main.layoutManager._updateKeyboardBox();
    });

    // Keyboard layout
    this._settings.connect('changed::layout', () => {
        osk_layout = this._settings.get_string('layout');
        Main.layoutManager._updateKeyboardBox();
    });

    // Landscape height
    this._settings.connect('changed::landscape-height', () => {
        landscape_osk_height = this._settings.get_int('landscape-height');
        Main.layoutManager._updateKeyboardBox();
    });

    // Landscape width
    this._settings.connect('changed::landscape-width', () => {
        landscape_osk_width = this._settings.get_string('landscape-width');
        Main.layoutManager._updateKeyboardBox();
    });

    // Portrait height
    this._settings.connect('changed::portrait-height', () => {
        portrait_osk_height = this._settings.get_int('portrait-height');
        Main.layoutManager._updateKeyboardBox();
    });

    // Portrait width
    this._settings.connect('changed::portrait-width', () => {
        portrait_osk_width = this._settings.get_string('portrait-width');
        Main.layoutManager._updateKeyboardBox();
    });
}


// Convert the strings describing the keys' aspect ratio to numerical values
function convertOSKWidth(value) {
    switch (value) {
        case 'Narrow (0.75:1)':
        return 0.75;
        break;
        case 'Square (1:1)':
        return 1.0;
        break;
        case 'Medium Wide (1.25:1)':
        return 1.25;
        break;
        case 'Wide (1.5:1)':
        return 1.5;
        break;
        case 'Very Wide (1.75:1)':
        return 1.75;
        break;
        case 'Ultrawide (2:1)':
        return 2.0;
        break;

        default:
        return 1.0;
        break;
    }
}


// Show/hide the On-Screen Keyboard if the icon is touched
function _toggleKeyboardOnTouch() {
    if (Main.keyboard._keyboardVisible) {
        Main.keyboard.hide();
    } else {
        Main.keyboard.show(Main.layoutManager.bottomIndex);
    }
}


// Show/hide the On-Screen Keyboard if the icon is clicked
function _toggleKeyboardOnClick() {
    if (Main.keyboard._keyboardVisible) {
        Main.keyboard.hide();
    } else {
        // Check if the OSK is enabled in accessibility and if not, enable it.
        // This is required if the user wants to toggle the OSK by clicking.
        if(!_oskA11yApplicationsSettings.get_boolean(SHOW_KEYBOARD)) {
            // currently this needs two clicks
            _oskA11yApplicationsSettings.set_boolean(SHOW_KEYBOARD, true);
            Main.keyboard._sync();
        }
        Main.keyboard.show(Main.layoutManager.bottomIndex);
    }
}


// Change the maximum height of the keyboard depending on the tablet's
// orientation. The tweak works in conjunction with "override_updateKeyboardBox".
// We override the "maxHeight" variable with the height chosen by the user for
// either orientation. This works well, but we need to override "_updateKeyboardBox"
// as well if we want to recalculate the height even when the OSK is shown
// while the tablet's orientation changes.
function override_relayout() {
    let monitor = Main.layoutManager.keyboardMonitor;

    if (this.actor == null || monitor == null)
    return;

    let maxHeight;

    if (monitor.width < monitor.height) {
        // The tablet is in portrait mode
        maxHeight = monitor.height / (100 / portrait_osk_height);
    } else {
        // The tablet is in landscape mode
        maxHeight = monitor.height / (100 / landscape_osk_height);
    }

    this.actor.width = monitor.width;
    this.actor.height = maxHeight;
}


// Change the aspect ratio of the keys depending on the tablet's orientation.
// The tweak works in conjunction with "override_layoutButtons". We override the
// "width" variable by multiplying it by a user-selected aspect ratio. This works
// perfectly for 1:1, 1.5:1 and 2:1 ratios, but we need to override *layoutButtons"
// as well if we want more control over the keys' aspect ratio.
function override_appendKey(key, width = 1, height = 1) {
    let monitor = Main.layoutManager.keyboardMonitor;

    if (monitor.width < monitor.height) {
        // The tablet is in portrait mode
        width *= convertOSKWidth(portrait_osk_width);
    } else {
        // The tablet is in landscape mode
        width *= convertOSKWidth(landscape_osk_width);
    }

    let keyInfo = {
        key,
        left: this._currentCol,
        top: this._currentRow,
        width,
        height
    };

    let row = this._rows[this._rows.length - 1];
    row.keys.push(keyInfo);
    row.width += width;

    this._currentCol += width;
    this._maxCols = Math.max(this._currentCol, this._maxCols);
}


// Change the aspect ratio of the keys. This override is only needed for the key
// aspect ratios 0.75, 1.25 and 1.75.
function override_layoutButtons(container) {
    let nCol = 0, nRow = 0;

    // This doubles the "resolution" of the grid containing the keys to allow
    // key ratios of 0.75, 1.25 and 1.75.
    let OVERRIDE_KEY_SIZE = 4;

    for (let i = 0; i < this._rows.length; i++) {
        let row = this._rows[i];

        /* When starting a new row, see if we need some padding */
        if (nCol == 0) {
            let diff = this._maxCols - row.width;
            if (diff >= 1)
            nCol = diff * OVERRIDE_KEY_SIZE / 2;
            else
            nCol = diff * OVERRIDE_KEY_SIZE;
        }

        for (let j = 0; j < row.keys.length; j++) {
            let keyInfo = row.keys[j];
            let width = keyInfo.width * OVERRIDE_KEY_SIZE;
            let height = keyInfo.height * OVERRIDE_KEY_SIZE;

            this._gridLayout.attach(keyInfo.key, nCol, nRow, width, height);
            nCol += width;
        }

        nRow += OVERRIDE_KEY_SIZE;
        nCol = 0;
    }

    if (container)
    container.setRatio(this._maxCols, this._rows.length);
}


// Override the keyboard layout with the user-selected layout.
function override_loadModel(groupName) {
    if (override_enabled)
    groupName = osk_layout;

    // As I haven't found a way to override the 'KeyboardModel' class
    // constructor for GNOME Shell 3.32 and up, we need to check once more if
    // the layout exists and load a fallback layout if it doesn't.
    try {
        let file = Gio.File.new_for_uri('resource:///org/gnome/shell/osk-layouts/%s.json'.format(groupName));
        let [success, contents] = file.load_contents(null);
        if (contents instanceof Uint8Array)
        contents = imports.byteArray.toString(contents);

        return JSON.parse(contents);
    } catch (e) {
        let file = Gio.File.new_for_uri('resource:///org/gnome/shell/osk-layouts/%s.json'.format('us'));
        let [success, contents] = file.load_contents(null);
        if (contents instanceof Uint8Array)
        contents = imports.byteArray.toString(contents);

        return JSON.parse(contents);
    }
}


// Override the update of the keyboard box in order to fully rebuild the OSK
// after every orientation change. This is required if the keys' aspect ratio
// is different in portrait and in landscape mode.
function override_updateKeyboardBox() {
    this.keyboardBox.set_position(this.keyboardMonitor.x, this.keyboardMonitor.y + this.keyboardMonitor.height);

    let maxHeight;

    if (this.keyboardMonitor.width < this.keyboardMonitor.height) {
        // The tablet is in portrait mode
        maxHeight = this.keyboardMonitor.height / (100 / portrait_osk_height);
    } else {
        // The tablet is in landscape mode
        maxHeight = this.keyboardMonitor.height / (100 / landscape_osk_height);
    }

    this.keyboardBox.set_size(this.keyboardMonitor.width, maxHeight);

    // Rebuild the OSK after an orientation change
    _destroyOSK();
    _setupOSK();
}


function init() {
}


function enable() {
    _loadSettings();
    _settingsChangeHandler();

    _oskA11yApplicationsSettings = new Gio.Settings({ schema_id: A11Y_APPLICATIONS_SCHEMA });

    // Set up the indicator in the status area
    _indicator = new OSKButton();
    Main.panel.addToStatusArea(IndicatorName, _indicator);

    // Backup the original functions
    backup_relayout = Keyboard.Keyboard.prototype['_relayout'];
    backup_appendKey = Keyboard.KeyContainer.prototype['appendKey'];
    backup_layoutButtons = Keyboard.KeyContainer.prototype['layoutButtons'];
    backup_loadModel = Keyboard.KeyboardModel.prototype['_loadModel']
    backup_updateKeyboardBox = Layout.LayoutManager.prototype['_updateKeyboardBox'];

    _destroyOSK();

    // Enable the overrides
    Keyboard.Keyboard.prototype['_relayout'] = override_relayout;
    Keyboard.KeyContainer.prototype['appendKey'] = override_appendKey;
    Keyboard.KeyContainer.prototype['layoutButtons'] = override_layoutButtons;
    Keyboard.KeyboardModel.prototype['_loadModel'] = override_loadModel;
    Layout.LayoutManager.prototype['_updateKeyboardBox'] = override_updateKeyboardBox;

    _setupOSK();
}


function disable() {
    _destroyOSK();

    // Reset to default values
    _setDefaultValues();

    // Reinstate the original methods
    Keyboard.Keyboard.prototype['_relayout'] = backup_relayout;
    Keyboard.KeyContainer.prototype['appendKey'] = backup_appendKey;
    Keyboard.KeyContainer.prototype['layoutButtons'] = backup_layoutButtons;
    Keyboard.KeyboardModel.prototype['_loadModel'] = backup_loadModel;
    Layout.LayoutManager.prototype['_updateKeyboardBox'] = backup_updateKeyboardBox;

    backup_relayout = null;
    backup_appendKey = null;
    backup_layoutButtons = null;
    backup_loadModel = null;
    backup_updateKeyboardBox = null;

    _setupOSK();

    // Destroy the indicator in the status area
    _indicator.destroy();
    _indicator = null;
}
