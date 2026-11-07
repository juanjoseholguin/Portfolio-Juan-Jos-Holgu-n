/* Equipos modestos: menos resolución y materiales más simples. */
export const LOW = window.innerWidth < 760 || (navigator.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
