#!/bin/sh

if [ ! -d ~/.local/share/gnome-shell/extensions ]; then
    mkdir ~/.local/share/gnome-shell/extensions
fi

echo "Installing the 'On-Screen Keyboard Tweaks' GNOME Shell Extension..."
cp -r osk-tweaks@jlempen.github.com ~/.local/share/gnome-shell/extensions
echo "Done!"
