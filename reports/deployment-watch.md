# Deployment Watch Report

Date: 2026-06-19
Checked at: 2026-06-19 18:35:52 CST
Repo: `zhongyang1122/mystic-east`
Branch checked: `main` and `origin/main`
Commit checked live against: `f455125` (`Add SEO quality gate and paid reading QA`)

## Result

`http://yourbazi.xyz` is serving the latest repository content from `origin/main`, including the launch trust fix markers and canonical URL change.

`https://yourbazi.xyz` is still not healthy for real users because the TLS certificate does not cover `yourbazi.xyz`, so deployment cannot be marked successful.

No safe repo-side fix was found in this run.

## Evidence

1. Local repo matches remote.
   - `HEAD`: `f4551259ba756d38a3f304d2351abfcf72257223`
   - `origin/main`: `f4551259ba756d38a3f304d2351abfcf72257223`
   - `git diff --stat HEAD origin/main`: no output

2. The repo contains the expected launch trust fix markers and canonical URLs.
   - [`/Users/zhongyangyy/.hermes/projects/mystic-east/index.html`](/Users/zhongyangyy/.hermes/projects/mystic-east/index.html) includes:
     - `Private`
     - `No account`
     - `English-first`
     - canonical `https://yourbazi.xyz/`
   - [`/Users/zhongyangyy/.hermes/projects/mystic-east/CNAME`](/Users/zhongyangyy/.hermes/projects/mystic-east/CNAME) is `yourbazi.xyz`

3. `http://yourbazi.xyz` serves the new homepage from GitHub Pages.
   - Response headers include:
     - `HTTP/1.1 200 OK`
     - `Server: GitHub.com`
     - `Last-Modified: Thu, 18 Jun 2026 11:36:51 GMT`
     - `Content-Length: 9490`
   - Returned HTML includes:
     - `<link rel="canonical" href="https://yourbazi.xyz/">`
     - `Private`
     - `No account`
     - `English-first`

4. `https://yourbazi.xyz` still fails for normal users because the TLS certificate does not match `yourbazi.xyz`.
   - Normal request fails with:
     - `curl: (60) SSL: no alternative certificate subject name matches target host name 'yourbazi.xyz'`
   - TLS leaf certificate currently presents:
     - `subject=CN=*.github.io`
     - `issuer=C=US, O=Let's Encrypt, CN=R12`
   - Certificate SANs currently show only GitHub defaults:
     - `DNS:*.github.com`
     - `DNS:*.github.io`
     - `DNS:*.githubusercontent.com`
     - `DNS:github.com`
     - `DNS:github.io`
     - `DNS:githubusercontent.com`

5. DNS points to GitHub Pages and the `www` host aliases to the expected GitHub Pages domain.
   - A records observed:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - `www.yourbazi.xyz CNAME`:
     - `zhongyang1122.github.io.`

6. Recent commits confirm the trust-fix work is already in the published branch.
   - `f455125` `Add SEO quality gate and paid reading QA`
   - `f77ccbb` `Fix launch trust and domain metadata`

## Assessment

This is not a stale-content problem in the repository. The current failure is at the GitHub Pages custom-domain / certificate layer.

Because the valid user-facing URL is `https://yourbazi.xyz`, the deployment is still incomplete even though `http://yourbazi.xyz` is serving the latest HTML.

## Exact Action Needed

In GitHub repository settings for Pages:

1. Open `Settings -> Pages`.
2. Confirm the published source is the expected branch for this repo.
3. Confirm `Custom domain` is exactly `yourbazi.xyz`.
4. If it already shows `yourbazi.xyz`, remove it, save, then add `yourbazi.xyz` again to force GitHub Pages to reprovision the certificate.
5. Wait for GitHub Pages to finish DNS check and certificate issuance.
6. Re-enable `Enforce HTTPS` only after `https://yourbazi.xyz` validates normally and no longer presents the default `*.github.io` certificate.

If GitHub Pages already looks correct but the cert still stays on `*.github.io`, the remaining fix is outside this repo and must be done in GitHub Pages settings/dashboard.
