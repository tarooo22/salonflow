R2 migration audit notes:

- Current server/storage.ts uploads through Manus Forge presign and returns /manus-storage/{key}; signed receipt downloads also use Forge.
- server/_core/storageProxy.ts is a local 404 stub, so public media URLs are not portable outside Manus.
- media.ts mediaUrl() creates /manus-storage paths. Protected client gallery currently returns mediaUrl() after role checks; a public proxy must not make these client images globally accessible.
- media router stores location covers, staff avatars, client before/after media, and location feed media as object keys.
- R2 design must keep public salon cover/staff/feed assets separate in access policy and keep client gallery and billing receipts signed/authorization-checked.
