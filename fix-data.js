// Run this in browser console to fix data issues
console.log('Fixing data...');
localStorage.removeItem('branchOutDB');
if (window.inMemoryDB) window.inMemoryDB = null;
window.location.reload();
