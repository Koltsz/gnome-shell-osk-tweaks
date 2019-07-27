#!/bin/sh

if [ -f ./osk-tweaks@jlempen.github.com.zip ]; then
    rm -rf ./osk-tweaks@jlempen.github.com.zip
fi

cd osk-tweaks@jlempen.github.com/
zip -r ../osk-tweaks@jlempen.github.com.zip *
