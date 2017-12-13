#!/bin/sh

if [ -z "$SFUSER" ]; then
	# Feel free to add your commonly-used accounts here.
	case "$USER" in
		jhallen)	SFUSER=jhallen ;;
		joe)		SFUSER=jhallen ;;
		jj) 		SFUSER=jjjordan ;;
		jjjordan)	SFUSER=jjjordan ;;
		*)		echo Please set the SFUSER environment variable to your sourceforge user name
				echo or edit this script to add a shortcut.
				exit 1 ;;
	esac
fi

cd $(dirname $0)

echo ===
echo === Building website
echo ===
echo ''

# Ensure clean build
rm -rf dist
./node_modules/.bin/gulp || exit $?

echo ===
echo === Rsync-ing dist/ to $SFUSER@web.sourceforge.net
echo ===
echo ''

# Upload
rsync -azP -e ssh --delete "$@" dist/ $SFUSER@web.sourceforge.net:/home/project-web/joe-editor/htdocs/
