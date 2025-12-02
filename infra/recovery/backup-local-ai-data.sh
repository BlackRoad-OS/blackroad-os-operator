#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# BLACKROAD DATA RECOVERY - LOCAL BACKUP
# ═══════════════════════════════════════════════════════════════════
# Owner: ALEXA LOUISE AMUNDSON
# Purpose: Backup local AI app data before requesting exports
# ═══════════════════════════════════════════════════════════════════

set -e

BACKUP_DIR="$HOME/blackroad-recovery-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "═══════════════════════════════════════════════════════════════════"
echo "     BLACKROAD DATA RECOVERY - LOCAL BACKUP"
echo "═══════════════════════════════════════════════════════════════════"
echo "     Owner: ALEXA LOUISE AMUNDSON"
echo "     Backup: $BACKUP_DIR"
echo "═══════════════════════════════════════════════════════════════════"
echo

# ChatGPT Atlas (Desktop App)
echo "[1/4] Backing up ChatGPT Desktop data..."
CHATGPT_DIR="$HOME/Library/Application Support/com.openai.atlas"
if [ -d "$CHATGPT_DIR" ]; then
    mkdir -p "$BACKUP_DIR/chatgpt-atlas"
    cp -r "$CHATGPT_DIR/conversations-v3-"* "$BACKUP_DIR/chatgpt-atlas/" 2>/dev/null || true
    cp -r "$CHATGPT_DIR/user-"* "$BACKUP_DIR/chatgpt-atlas/" 2>/dev/null || true
    CONV_COUNT=$(ls "$CHATGPT_DIR/conversations-v3-"*/  2>/dev/null | wc -l | tr -d ' ')
    echo "   ✓ Backed up $CONV_COUNT conversations"
else
    echo "   - No ChatGPT Desktop data found"
fi

# Claude Desktop
echo "[2/4] Backing up Claude Desktop data..."
CLAUDE_DIR="$HOME/Library/Application Support/Claude"
if [ -d "$CLAUDE_DIR" ]; then
    mkdir -p "$BACKUP_DIR/claude-desktop"
    cp -r "$CLAUDE_DIR" "$BACKUP_DIR/claude-desktop/"
    echo "   ✓ Backed up Claude Desktop data"
else
    echo "   - No Claude Desktop data found"
fi

# OpenAI folder
echo "[3/4] Backing up OpenAI data..."
OPENAI_DIR="$HOME/Library/Application Support/OpenAI"
if [ -d "$OPENAI_DIR" ]; then
    mkdir -p "$BACKUP_DIR/openai"
    cp -r "$OPENAI_DIR" "$BACKUP_DIR/openai/"
    echo "   ✓ Backed up OpenAI data"
else
    echo "   - No OpenAI data found"
fi

# Google Chrome AI data (Gemini cookies/sessions)
echo "[4/4] Backing up browser AI sessions..."
CHROME_DIR="$HOME/Library/Application Support/Google/Chrome/Default"
if [ -d "$CHROME_DIR" ]; then
    mkdir -p "$BACKUP_DIR/chrome-sessions"
    cp "$CHROME_DIR/Cookies" "$BACKUP_DIR/chrome-sessions/" 2>/dev/null || true
    cp -r "$CHROME_DIR/Session Storage" "$BACKUP_DIR/chrome-sessions/" 2>/dev/null || true
    echo "   ✓ Backed up Chrome session data"
else
    echo "   - No Chrome data found"
fi

# Summary
echo
echo "═══════════════════════════════════════════════════════════════════"
echo "     BACKUP COMPLETE"
echo "═══════════════════════════════════════════════════════════════════"
echo
du -sh "$BACKUP_DIR"
echo
echo "Backup location: $BACKUP_DIR"
echo
echo "Next steps:"
echo "  1. Go to https://chat.openai.com/settings → Export Data"
echo "  2. Go to https://claude.ai/settings → Privacy → Export"
echo "  3. Go to https://takeout.google.com → Select Gemini"
echo
echo "After exports arrive, run import-to-blackroad.sh"
echo
echo "═══════════════════════════════════════════════════════════════════"
