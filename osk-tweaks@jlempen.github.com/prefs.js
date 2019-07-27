// On-Screen Keyboard Tweaks
// Extension version 2 for GNOME Shell 3.28, 3.30 and 3.32
// Copyright (c) 2019 Jürg Lempen
// https://github.com/jlempen/gnome-shell-osk-tweaks
// Licensed under GPLv3

const { Gio, GLib, Gtk } = imports.gi;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Utils = Me.imports.utils;

let settings;

let layouts = ['am', 'ara', 'be', 'bg', 'by', 'ca', 'cz', 'de', 'dk', 'ee', 'epo', 'es+cat', 'es', 'fi', 'fr', 'ge', 'gr',
'hr', 'hu', 'id', 'il', 'in+bolnagri', 'in+mal', 'ir', 'is', 'it', 'ke', 'kg', 'kh', 'la', 'latam', 'lt', 'lv', 'mk', 'mn',
'my', 'nl', 'no', 'ph', 'pl', 'pt', 'ro', 'rs', 'ru', 'se', 'si', 'sk', 'th', 'tr', 'ua', 'uk', 'us', 'vn', 'za', 'emoji'];

let layoutsName = ["Armenian", "Arabic", "Dutch (Belgium)", "Bulgarian", "Belarusian", "French Canada", "Czech", "German",
"Danish", "Estonian", "Esperanto", "Catalan", "Spanish", "Finnish", "French", "Georgian", "Greek", "Croatian", "Hungarian",
"Indonesian", "Hebrew", "Hindi", "Malayalam", "Persian", "Icelandic", "Italian", "Swahili", "Kirghiz", "Khmer", "Lao",
"Spanish United States", "Lithuanian", "Latvian", "Macedonian", "Mongolian", "Malay", "Dutch", "Norwegian Bokmål", "Filipino",
"Polish", "Portuguese Portugal", "Romanian", "Serbian", "Russian", "Swedish", "Slovenian", "Slovak", "Thai", "Turkish",
"Ukrainian", "English Great Britain", "English United States", "Vietnamese", "Afrikaans", "Emoji"];

let widths = [
    'Narrow (0.75:1)',
    'Square (1:1)',
    'Medium Wide (1.25:1)',
    'Wide (1.5:1)',
    'Very Wide (1.75:1)',
    'Ultrawide (2:1)'
];

function init() {
    settings = Utils.getSettings(Me);
    Convenience.initTranslations();
}

function buildPrefsWidget() {
    // Prepare labels and controls
    let buildable = new Gtk.Builder();
    buildable.add_from_file( Me.dir.get_path() + '/Settings.ui' );
    let box = buildable.get_object('prefs_widget');

    buildable.get_object('extension_version').set_text(Me.metadata.version.toString());
    buildable.get_object('extension_name').set_text(Me.metadata.name.toString());

    let showSwitch = buildable.get_object('show');
    let overrideSwitch = buildable.get_object('override_switch');
    let layoutCombo = buildable.get_object('layout');
    let landscape_heightSpin = buildable.get_object('landscape_height');
    let landscape_widthCombo = buildable.get_object('landscape_width');
    let portrait_heightSpin = buildable.get_object('portrait_height');
    let portrait_widthCombo = buildable.get_object('portrait_width');

    // Populate the combo boxes with the keyboard layouts and associated country names
    layouts.forEach(function (osklayout, index) {
        layoutCombo.append(osklayout, osklayout+" - "+layoutsName[index]);
    })

    // Populate the combo boxes with the strings for the key width
    widths.forEach(function (x) {
        landscape_widthCombo.append(x, x);
        portrait_widthCombo.append(x, x);
    })

    // Bind the controls to the settings
    settings.bind('show', showSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('override-switch', overrideSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('layout', layoutCombo, 'active_id', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('landscape-height', landscape_heightSpin, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('landscape-width', landscape_widthCombo, 'active_id', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('portrait-height', portrait_heightSpin, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('portrait-width', portrait_widthCombo, 'active_id', Gio.SettingsBindFlags.DEFAULT);

    box.show_all();

    return box;
};
