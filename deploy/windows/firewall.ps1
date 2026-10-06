# Открыть входящий порт 80 в брандмауэре Windows (запускать от администратора).
# 5000 (Nest) и 5432 (PostgreSQL) наружу НЕ открываем — к ним ходит только Caddy/nginx локально.
New-NetFirewallRule -DisplayName "Art Gallery HTTP (80)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
# Когда появится домен и HTTPS:
# New-NetFirewallRule -DisplayName "Art Gallery HTTPS (443)" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
