#!/bin/bash
# Script for deploying to Heroku with a smaller package

# Create a new deployment branch
git checkout -b deploy-heroku

# Copy the production requirements file
cp requirements.prod.txt requirements.txt

# Create temporary slug size reduction file
touch .slug-post-clean

# Setup pre-compile hooks for Heroku
mkdir -p .heroku

# Create a hook to clean up the slug after building
cat > .heroku/post_compile << 'EOF'
#!/bin/bash
if [ -f .slug-post-clean ]; then
  echo "-----> Cleaning slug to reduce size"
  rm -rf .git
  rm -rf frontend
  rm -rf docs
  rm -rf *.md
  find . -name "__pycache__" -type d -exec rm -rf {} +
  find . -name "*.pyc" -delete
  echo "-----> Slug cleaning complete"
fi
EOF

# Make the hook executable
chmod +x .heroku/post_compile

# Commit changes
git add .
git commit -m "Prepare for Heroku deployment"

# Push to Heroku
git push heroku deploy-heroku:main -f

# Clean up
git checkout main
git branch -D deploy-heroku