#!/bin/sh
# Пароль Ansible Vault: из $ANSIBLE_VAULT_PASSWORD (CI) или из файла .vault_pass рядом (локально, в .gitignore)
if [ -n "${ANSIBLE_VAULT_PASSWORD:-}" ]; then
  printf '%s\n' "$ANSIBLE_VAULT_PASSWORD"
elif [ -f "$(dirname "$0")/.vault_pass" ]; then
  cat "$(dirname "$0")/.vault_pass"
else
  echo "Нет пароля Ansible Vault: создайте devops/ansible/.vault_pass (make infra-vault) или задайте ANSIBLE_VAULT_PASSWORD" >&2
  exit 1
fi
