@echo on
rmdir /s /q node_modules
git add .
git commit -m "Commit"
git push
npm install