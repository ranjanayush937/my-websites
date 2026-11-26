/* Loaded first. Data files register content here; app.js renders it. */
window.GUIDE = {
  cats: [],
  extras: {},
  // Add a category. A second call with the same id appends its services.
  add(c) {
    const ex = this.cats.find(x => x.id === c.id);
    if (ex) ex.services.push(...c.services);
    else this.cats.push(c);
  },
  // Attach priority and interview questions to services by id.
  extra(o) {
    for (const id in o) {
      const cur = this.extras[id] || (this.extras[id] = {});
      for (const k in o[id]) cur[k] = Array.isArray(o[id][k]) && cur[k] ? cur[k].concat(o[id][k]) : o[id][k];
    }
  }
};
