"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/sql.js/dist/sql-wasm-browser.js
var require_sql_wasm_browser = __commonJS({
  "node_modules/sql.js/dist/sql-wasm-browser.js"(exports, module2) {
    var initSqlJsPromise = void 0;
    var initSqlJs2 = function(moduleConfig) {
      if (initSqlJsPromise) {
        return initSqlJsPromise;
      }
      initSqlJsPromise = new Promise(function(resolveModule, reject) {
        var Module = typeof moduleConfig !== "undefined" ? moduleConfig : {};
        var originalOnAbortFunction = Module["onAbort"];
        Module["onAbort"] = function(errorThatCausedAbort) {
          reject(new Error(errorThatCausedAbort));
          if (originalOnAbortFunction) {
            originalOnAbortFunction(errorThatCausedAbort);
          }
        };
        Module["postRun"] = Module["postRun"] || [];
        Module["postRun"].push(function() {
          resolveModule(Module);
        });
        module2 = void 0;
        var k;
        k || (k = typeof Module != "undefined" ? Module : {});
        var aa = !!globalThis.window, ba = !!globalThis.WorkerGlobalScope;
        k.onRuntimeInitialized = function() {
          function a(f, l) {
            switch (typeof l) {
              case "boolean":
                $b(f, l ? 1 : 0);
                break;
              case "number":
                ac(f, l);
                break;
              case "string":
                bc(f, l, -1, -1);
                break;
              case "object":
                if (null === l)
                  eb(f);
                else if (null != l.length) {
                  var n = ca(l.length);
                  m.set(l, n);
                  cc(f, n, l.length, -1);
                  da(n);
                } else
                  ra(f, "Wrong API use : tried to return a value of an unknown type (" + l + ").", -1);
                break;
              default:
                eb(f);
            }
          }
          function b(f, l) {
            for (var n = [], p = 0; p < f; p += 1) {
              var u = r(l + 4 * p, "i32"), v = dc(u);
              if (1 === v || 2 === v)
                u = ec(u);
              else if (3 === v)
                u = fc(u);
              else if (4 === v) {
                v = u;
                u = gc(v);
                v = hc(v);
                for (var K = new Uint8Array(u), I = 0; I < u; I += 1)
                  K[I] = m[v + I];
                u = K;
              } else
                u = null;
              n.push(u);
            }
            return n;
          }
          function c(f, l) {
            this.Qa = f;
            this.db = l;
            this.Oa = 1;
            this.yb = [];
          }
          function d(f, l) {
            this.db = l;
            this.ob = ea(f);
            if (null === this.ob)
              throw Error("Unable to allocate memory for the SQL string");
            this.ub = this.ob;
            this.gb = this.Fb = null;
          }
          function e(f) {
            this.filename = "dbfile_" + (4294967295 * Math.random() >>> 0);
            if (null != f) {
              var l = this.filename, n = "/", p = l;
              n && (n = "string" == typeof n ? n : fa(n), p = l ? ha(n + "/" + l) : n);
              l = ia(true, true);
              p = ja(
                p,
                l
              );
              if (f) {
                if ("string" == typeof f) {
                  n = Array(f.length);
                  for (var u = 0, v = f.length; u < v; ++u)
                    n[u] = f.charCodeAt(u);
                  f = n;
                }
                ka(p, l | 146);
                n = la(p, 577);
                ma(n, f, 0, f.length, 0);
                na(n);
                ka(p, l);
              }
            }
            this.handleError(q(this.filename, g));
            this.db = r(g, "i32");
            hb(this.db);
            this.pb = {};
            this.Sa = {};
          }
          var g = y(4), h = k.cwrap, q = h("sqlite3_open", "number", ["string", "number"]), w = h("sqlite3_close_v2", "number", ["number"]), t = h("sqlite3_exec", "number", ["number", "string", "number", "number", "number"]), x = h("sqlite3_changes", "number", ["number"]), D = h(
            "sqlite3_prepare_v2",
            "number",
            ["number", "string", "number", "number", "number"]
          ), ib = h("sqlite3_sql", "string", ["number"]), jc = h("sqlite3_normalized_sql", "string", ["number"]), jb = h("sqlite3_prepare_v2", "number", ["number", "number", "number", "number", "number"]), kc = h("sqlite3_bind_text", "number", ["number", "number", "number", "number", "number"]), kb = h("sqlite3_bind_blob", "number", ["number", "number", "number", "number", "number"]), lc = h("sqlite3_bind_double", "number", ["number", "number", "number"]), mc = h("sqlite3_bind_int", "number", [
            "number",
            "number",
            "number"
          ]), nc = h("sqlite3_bind_parameter_index", "number", ["number", "string"]), oc = h("sqlite3_step", "number", ["number"]), pc = h("sqlite3_errmsg", "string", ["number"]), qc = h("sqlite3_column_count", "number", ["number"]), rc = h("sqlite3_data_count", "number", ["number"]), sc = h("sqlite3_column_double", "number", ["number", "number"]), lb = h("sqlite3_column_text", "string", ["number", "number"]), tc = h("sqlite3_column_blob", "number", ["number", "number"]), uc = h("sqlite3_column_bytes", "number", ["number", "number"]), vc = h(
            "sqlite3_column_type",
            "number",
            ["number", "number"]
          ), wc = h("sqlite3_column_name", "string", ["number", "number"]), xc = h("sqlite3_reset", "number", ["number"]), yc = h("sqlite3_clear_bindings", "number", ["number"]), zc = h("sqlite3_finalize", "number", ["number"]), mb = h("sqlite3_create_function_v2", "number", "number string number number number number number number number".split(" ")), dc = h("sqlite3_value_type", "number", ["number"]), gc = h("sqlite3_value_bytes", "number", ["number"]), fc = h("sqlite3_value_text", "string", ["number"]), hc = h(
            "sqlite3_value_blob",
            "number",
            ["number"]
          ), ec = h("sqlite3_value_double", "number", ["number"]), ac = h("sqlite3_result_double", "", ["number", "number"]), eb = h("sqlite3_result_null", "", ["number"]), bc = h("sqlite3_result_text", "", ["number", "string", "number", "number"]), cc = h("sqlite3_result_blob", "", ["number", "number", "number", "number"]), $b = h("sqlite3_result_int", "", ["number", "number"]), ra = h("sqlite3_result_error", "", ["number", "string", "number"]), nb = h("sqlite3_aggregate_context", "number", ["number", "number"]), hb = h(
            "RegisterExtensionFunctions",
            "number",
            ["number"]
          ), ob = h("sqlite3_update_hook", "number", ["number", "number", "number"]);
          c.prototype.bind = function(f) {
            if (!this.Qa)
              throw "Statement closed";
            this.reset();
            return Array.isArray(f) ? this.Wb(f) : null != f && "object" === typeof f ? this.Xb(f) : true;
          };
          c.prototype.step = function() {
            if (!this.Qa)
              throw "Statement closed";
            this.Oa = 1;
            var f = oc(this.Qa);
            switch (f) {
              case 100:
                return true;
              case 101:
                return false;
              default:
                throw this.db.handleError(f);
            }
          };
          c.prototype.Pb = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            return sc(this.Qa, f);
          };
          c.prototype.hc = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            f = lb(this.Qa, f);
            if ("function" !== typeof BigInt)
              throw Error("BigInt is not supported");
            return BigInt(f);
          };
          c.prototype.mc = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            return lb(this.Qa, f);
          };
          c.prototype.getBlob = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            var l = uc(this.Qa, f);
            f = tc(this.Qa, f);
            for (var n = new Uint8Array(l), p = 0; p < l; p += 1)
              n[p] = m[f + p];
            return n;
          };
          c.prototype.get = function(f, l) {
            l = l || {};
            null != f && this.bind(f) && this.step();
            f = [];
            for (var n = rc(this.Qa), p = 0; p < n; p += 1)
              switch (vc(this.Qa, p)) {
                case 1:
                  var u = l.useBigInt ? this.hc(p) : this.Pb(p);
                  f.push(u);
                  break;
                case 2:
                  f.push(this.Pb(p));
                  break;
                case 3:
                  f.push(this.mc(p));
                  break;
                case 4:
                  f.push(this.getBlob(p));
                  break;
                default:
                  f.push(null);
              }
            return f;
          };
          c.prototype.Db = function() {
            for (var f = [], l = qc(this.Qa), n = 0; n < l; n += 1)
              f.push(wc(this.Qa, n));
            return f;
          };
          c.prototype.Ob = function(f, l) {
            f = this.get(f, l);
            l = this.Db();
            for (var n = {}, p = 0; p < l.length; p += 1)
              n[l[p]] = f[p];
            return n;
          };
          c.prototype.lc = function() {
            return ib(this.Qa);
          };
          c.prototype.ic = function() {
            return jc(this.Qa);
          };
          c.prototype.Jb = function(f) {
            null != f && this.bind(f);
            this.step();
            return this.reset();
          };
          c.prototype.Lb = function(f, l) {
            null == l && (l = this.Oa, this.Oa += 1);
            f = ea(f);
            this.yb.push(f);
            this.db.handleError(kc(this.Qa, l, f, -1, 0));
          };
          c.prototype.Vb = function(f, l) {
            null == l && (l = this.Oa, this.Oa += 1);
            var n = ca(f.length);
            m.set(f, n);
            this.yb.push(n);
            this.db.handleError(kb(this.Qa, l, n, f.length, 0));
          };
          c.prototype.Kb = function(f, l) {
            null == l && (l = this.Oa, this.Oa += 1);
            this.db.handleError((f === (f | 0) ? mc : lc)(
              this.Qa,
              l,
              f
            ));
          };
          c.prototype.Yb = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            kb(this.Qa, f, 0, 0, 0);
          };
          c.prototype.Mb = function(f, l) {
            null == l && (l = this.Oa, this.Oa += 1);
            switch (typeof f) {
              case "string":
                this.Lb(f, l);
                return;
              case "number":
                this.Kb(f, l);
                return;
              case "bigint":
                this.Lb(f.toString(), l);
                return;
              case "boolean":
                this.Kb(f + 0, l);
                return;
              case "object":
                if (null === f) {
                  this.Yb(l);
                  return;
                }
                if (null != f.length) {
                  this.Vb(f, l);
                  return;
                }
            }
            throw "Wrong API use : tried to bind a value of an unknown type (" + f + ").";
          };
          c.prototype.Xb = function(f) {
            var l = this;
            Object.keys(f).forEach(function(n) {
              var p = nc(l.Qa, n);
              0 !== p && l.Mb(f[n], p);
            });
            return true;
          };
          c.prototype.Wb = function(f) {
            for (var l = 0; l < f.length; l += 1)
              this.Mb(f[l], l + 1);
            return true;
          };
          c.prototype.reset = function() {
            this.Cb();
            return 0 === yc(this.Qa) && 0 === xc(this.Qa);
          };
          c.prototype.Cb = function() {
            for (var f; void 0 !== (f = this.yb.pop()); )
              da(f);
          };
          c.prototype.cb = function() {
            this.Cb();
            var f = 0 === zc(this.Qa);
            delete this.db.pb[this.Qa];
            this.Qa = 0;
            return f;
          };
          d.prototype.next = function() {
            if (null === this.ob)
              return { done: true };
            null !== this.gb && (this.gb.cb(), this.gb = null);
            if (!this.db.db)
              throw this.Ab(), Error("Database closed");
            var f = oa(), l = y(4);
            pa(g);
            pa(l);
            try {
              this.db.handleError(jb(this.db.db, this.ub, -1, g, l));
              this.ub = r(l, "i32");
              var n = r(g, "i32");
              if (0 === n)
                return this.Ab(), { done: true };
              this.gb = new c(n, this.db);
              this.db.pb[n] = this.gb;
              return { value: this.gb, done: false };
            } catch (p) {
              throw this.Fb = z(this.ub), this.Ab(), p;
            } finally {
              qa(f);
            }
          };
          d.prototype.Ab = function() {
            da(this.ob);
            this.ob = null;
          };
          d.prototype.jc = function() {
            return null !== this.Fb ? this.Fb : z(this.ub);
          };
          "function" === typeof Symbol && "symbol" === typeof Symbol.iterator && (d.prototype[Symbol.iterator] = function() {
            return this;
          });
          e.prototype.Jb = function(f, l) {
            if (!this.db)
              throw "Database closed";
            if (l) {
              f = this.Gb(f, l);
              try {
                f.step();
              } finally {
                f.cb();
              }
            } else
              this.handleError(t(this.db, f, 0, 0, g));
            return this;
          };
          e.prototype.exec = function(f, l, n) {
            if (!this.db)
              throw "Database closed";
            var p = null, u = null, v = null;
            try {
              v = u = ea(f);
              var K = y(4);
              for (f = []; 0 !== r(v, "i8"); ) {
                pa(g);
                pa(K);
                this.handleError(jb(this.db, v, -1, g, K));
                var I = r(g, "i32");
                v = r(
                  K,
                  "i32"
                );
                if (0 !== I) {
                  var H = null;
                  p = new c(I, this);
                  for (null != l && p.bind(l); p.step(); )
                    null === H && (H = { columns: p.Db(), values: [] }, f.push(H)), H.values.push(p.get(null, n));
                  p.cb();
                }
              }
              return f;
            } catch (L) {
              throw p && p.cb(), L;
            } finally {
              u && da(u);
            }
          };
          e.prototype.ec = function(f, l, n, p, u) {
            "function" === typeof l && (p = n, n = l, l = void 0);
            f = this.Gb(f, l);
            try {
              for (; f.step(); )
                n(f.Ob(null, u));
            } finally {
              f.cb();
            }
            if ("function" === typeof p)
              return p();
          };
          e.prototype.Gb = function(f, l) {
            pa(g);
            this.handleError(D(this.db, f, -1, g, 0));
            f = r(g, "i32");
            if (0 === f)
              throw "Nothing to prepare";
            var n = new c(f, this);
            null != l && n.bind(l);
            return this.pb[f] = n;
          };
          e.prototype.pc = function(f) {
            return new d(f, this);
          };
          e.prototype.fc = function() {
            Object.values(this.pb).forEach(function(l) {
              l.cb();
            });
            Object.values(this.Sa).forEach(A);
            this.Sa = {};
            this.handleError(w(this.db));
            var f = sa(this.filename);
            this.handleError(q(this.filename, g));
            this.db = r(g, "i32");
            hb(this.db);
            return f;
          };
          e.prototype.close = function() {
            null !== this.db && (Object.values(this.pb).forEach(function(f) {
              f.cb();
            }), Object.values(this.Sa).forEach(A), this.Sa = {}, this.fb && (A(this.fb), this.fb = void 0), this.handleError(w(this.db)), ta("/" + this.filename), this.db = null);
          };
          e.prototype.handleError = function(f) {
            if (0 === f)
              return null;
            f = pc(this.db);
            throw Error(f);
          };
          e.prototype.kc = function() {
            return x(this.db);
          };
          e.prototype.bc = function(f, l) {
            Object.prototype.hasOwnProperty.call(this.Sa, f) && (A(this.Sa[f]), delete this.Sa[f]);
            var n = ua(function(p, u, v) {
              u = b(u, v);
              try {
                var K = l.apply(null, u);
              } catch (I) {
                ra(p, I, -1);
                return;
              }
              a(p, K);
            }, "viii");
            this.Sa[f] = n;
            this.handleError(mb(
              this.db,
              f,
              l.length,
              1,
              0,
              n,
              0,
              0,
              0
            ));
            return this;
          };
          e.prototype.ac = function(f, l) {
            var n = l.init || function() {
              return null;
            }, p = l.finalize || function(H) {
              return H;
            }, u = l.step;
            if (!u)
              throw "An aggregate function must have a step function in " + f;
            var v = {};
            Object.hasOwnProperty.call(this.Sa, f) && (A(this.Sa[f]), delete this.Sa[f]);
            l = f + "__finalize";
            Object.hasOwnProperty.call(this.Sa, l) && (A(this.Sa[l]), delete this.Sa[l]);
            var K = ua(function(H, L, Ka) {
              var V = nb(H, 1);
              Object.hasOwnProperty.call(v, V) || (v[V] = n());
              L = b(L, Ka);
              L = [v[V]].concat(L);
              try {
                v[V] = u.apply(
                  null,
                  L
                );
              } catch (Bc) {
                delete v[V], ra(H, Bc, -1);
              }
            }, "viii"), I = ua(function(H) {
              var L = nb(H, 1);
              try {
                var Ka = p(v[L]);
              } catch (V) {
                delete v[L];
                ra(H, V, -1);
                return;
              }
              a(H, Ka);
              delete v[L];
            }, "vi");
            this.Sa[f] = K;
            this.Sa[l] = I;
            this.handleError(mb(this.db, f, u.length - 1, 1, 0, 0, K, I, 0));
            return this;
          };
          e.prototype.vc = function(f) {
            this.fb && (ob(this.db, 0, 0), A(this.fb), this.fb = void 0);
            if (!f)
              return this;
            this.fb = ua(function(l, n, p, u, v) {
              switch (n) {
                case 18:
                  l = "insert";
                  break;
                case 23:
                  l = "update";
                  break;
                case 9:
                  l = "delete";
                  break;
                default:
                  throw "unknown operationCode in updateHook callback: " + n;
              }
              p = z(p);
              u = z(u);
              if (v > Number.MAX_SAFE_INTEGER)
                throw "rowId too big to fit inside a Number";
              f(l, p, u, Number(v));
            }, "viiiij");
            ob(this.db, this.fb, 0);
            return this;
          };
          c.prototype.bind = c.prototype.bind;
          c.prototype.step = c.prototype.step;
          c.prototype.get = c.prototype.get;
          c.prototype.getColumnNames = c.prototype.Db;
          c.prototype.getAsObject = c.prototype.Ob;
          c.prototype.getSQL = c.prototype.lc;
          c.prototype.getNormalizedSQL = c.prototype.ic;
          c.prototype.run = c.prototype.Jb;
          c.prototype.reset = c.prototype.reset;
          c.prototype.freemem = c.prototype.Cb;
          c.prototype.free = c.prototype.cb;
          d.prototype.next = d.prototype.next;
          d.prototype.getRemainingSQL = d.prototype.jc;
          e.prototype.run = e.prototype.Jb;
          e.prototype.exec = e.prototype.exec;
          e.prototype.each = e.prototype.ec;
          e.prototype.prepare = e.prototype.Gb;
          e.prototype.iterateStatements = e.prototype.pc;
          e.prototype["export"] = e.prototype.fc;
          e.prototype.close = e.prototype.close;
          e.prototype.handleError = e.prototype.handleError;
          e.prototype.getRowsModified = e.prototype.kc;
          e.prototype.create_function = e.prototype.bc;
          e.prototype.create_aggregate = e.prototype.ac;
          e.prototype.updateHook = e.prototype.vc;
          k.Database = e;
        };
        var va = "./this.program", wa = globalThis.document?.currentScript?.src;
        ba && (wa = self.location.href);
        var xa = "", ya, za;
        if (aa || ba) {
          try {
            xa = new URL(".", wa).href;
          } catch {
          }
          ba && (za = (a) => {
            var b = new XMLHttpRequest();
            b.open("GET", a, false);
            b.responseType = "arraybuffer";
            b.send(null);
            return new Uint8Array(b.response);
          });
          ya = async (a) => {
            a = await fetch(a, { credentials: "same-origin" });
            if (a.ok)
              return a.arrayBuffer();
            throw Error(a.status + " : " + a.url);
          };
        }
        var Aa = console.log.bind(console), B = console.error.bind(console), Ba, Ca = false, Da, m, C, Ea, E, F, Fa, Ga, G;
        function Ha() {
          var a = Ia.buffer;
          m = new Int8Array(a);
          Ea = new Int16Array(a);
          C = new Uint8Array(a);
          new Uint16Array(a);
          E = new Int32Array(a);
          F = new Uint32Array(a);
          Fa = new Float32Array(a);
          Ga = new Float64Array(a);
          G = new BigInt64Array(a);
          new BigUint64Array(a);
        }
        function Ja(a) {
          k.onAbort?.(a);
          a = "Aborted(" + a + ")";
          B(a);
          Ca = true;
          throw new WebAssembly.RuntimeError(a + ". Build with -sASSERTIONS for more info.");
        }
        var La;
        async function Ma(a) {
          if (!Ba)
            try {
              var b = await ya(a);
              return new Uint8Array(b);
            } catch {
            }
          if (a == La && Ba)
            a = new Uint8Array(Ba);
          else if (za)
            a = za(a);
          else
            throw "both async and sync fetching of the wasm failed";
          return a;
        }
        async function Na(a, b) {
          try {
            var c = await Ma(a);
            return await WebAssembly.instantiate(c, b);
          } catch (d) {
            B(`failed to asynchronously prepare wasm: ${d}`), Ja(d);
          }
        }
        async function Oa(a) {
          var b = La;
          if (!Ba)
            try {
              var c = fetch(b, { credentials: "same-origin" });
              return await WebAssembly.instantiateStreaming(c, a);
            } catch (d) {
              B(`wasm streaming compile failed: ${d}`), B("falling back to ArrayBuffer instantiation");
            }
          return Na(b, a);
        }
        class Pa {
          constructor(a) {
            __publicField(this, "name", "ExitStatus");
            this.message = `Program terminated with exit(${a})`;
            this.status = a;
          }
        }
        var Qa = (a) => {
          for (; 0 < a.length; )
            a.shift()(k);
        }, Ra = [], Sa = [], Ta = () => {
          var a = k.preRun.shift();
          Sa.push(a);
        }, J = 0, Ua = null;
        function r(a, b = "i8") {
          b.endsWith("*") && (b = "*");
          switch (b) {
            case "i1":
              return m[a];
            case "i8":
              return m[a];
            case "i16":
              return Ea[a >> 1];
            case "i32":
              return E[a >> 2];
            case "i64":
              return G[a >> 3];
            case "float":
              return Fa[a >> 2];
            case "double":
              return Ga[a >> 3];
            case "*":
              return F[a >> 2];
            default:
              Ja(`invalid type for getValue: ${b}`);
          }
        }
        var Va = true;
        function pa(a) {
          var b = "i32";
          b.endsWith("*") && (b = "*");
          switch (b) {
            case "i1":
              m[a] = 0;
              break;
            case "i8":
              m[a] = 0;
              break;
            case "i16":
              Ea[a >> 1] = 0;
              break;
            case "i32":
              E[a >> 2] = 0;
              break;
            case "i64":
              G[a >> 3] = BigInt(0);
              break;
            case "float":
              Fa[a >> 2] = 0;
              break;
            case "double":
              Ga[a >> 3] = 0;
              break;
            case "*":
              F[a >> 2] = 0;
              break;
            default:
              Ja(`invalid type for setValue: ${b}`);
          }
        }
        var Wa = new TextDecoder(), Xa = (a, b, c, d) => {
          c = b + c;
          if (d)
            return c;
          for (; a[b] && !(b >= c); )
            ++b;
          return b;
        }, z = (a, b, c) => a ? Wa.decode(C.subarray(a, Xa(C, a, b, c))) : "", Ya = (a, b) => {
          for (var c = 0, d = a.length - 1; 0 <= d; d--) {
            var e = a[d];
            "." === e ? a.splice(d, 1) : ".." === e ? (a.splice(d, 1), c++) : c && (a.splice(d, 1), c--);
          }
          if (b)
            for (; c; c--)
              a.unshift("..");
          return a;
        }, ha = (a) => {
          var b = "/" === a.charAt(0), c = "/" === a.slice(-1);
          (a = Ya(a.split("/").filter((d) => !!d), !b).join("/")) || b || (a = ".");
          a && c && (a += "/");
          return (b ? "/" : "") + a;
        }, Za = (a) => {
          var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
          a = b[0];
          b = b[1];
          if (!a && !b)
            return ".";
          b && (b = b.slice(0, -1));
          return a + b;
        }, $a = (a) => a && a.match(/([^\/]+|\/)\/*$/)[1], ab = () => (a) => crypto.getRandomValues(a), bb = (a) => {
          (bb = ab())(a);
        }, cb = (...a) => {
          for (var b = "", c = false, d = a.length - 1; -1 <= d && !c; d--) {
            c = 0 <= d ? a[d] : "/";
            if ("string" != typeof c)
              throw new TypeError("Arguments to path.resolve must be strings");
            if (!c)
              return "";
            b = c + "/" + b;
            c = "/" === c.charAt(0);
          }
          b = Ya(b.split("/").filter((e) => !!e), !c).join("/");
          return (c ? "/" : "") + b || ".";
        }, db = (a) => {
          var b = Xa(a, 0);
          return Wa.decode(a.buffer ? a.subarray(0, b) : new Uint8Array(a.slice(0, b)));
        }, fb = [], gb = (a) => {
          for (var b = 0, c = 0; c < a.length; ++c) {
            var d = a.charCodeAt(c);
            127 >= d ? b++ : 2047 >= d ? b += 2 : 55296 <= d && 57343 >= d ? (b += 4, ++c) : b += 3;
          }
          return b;
        }, M = (a, b, c, d) => {
          if (!(0 < d))
            return 0;
          var e = c;
          d = c + d - 1;
          for (var g = 0; g < a.length; ++g) {
            var h = a.codePointAt(g);
            if (127 >= h) {
              if (c >= d)
                break;
              b[c++] = h;
            } else if (2047 >= h) {
              if (c + 1 >= d)
                break;
              b[c++] = 192 | h >> 6;
              b[c++] = 128 | h & 63;
            } else if (65535 >= h) {
              if (c + 2 >= d)
                break;
              b[c++] = 224 | h >> 12;
              b[c++] = 128 | h >> 6 & 63;
              b[c++] = 128 | h & 63;
            } else {
              if (c + 3 >= d)
                break;
              b[c++] = 240 | h >> 18;
              b[c++] = 128 | h >> 12 & 63;
              b[c++] = 128 | h >> 6 & 63;
              b[c++] = 128 | h & 63;
              g++;
            }
          }
          b[c] = 0;
          return c - e;
        }, pb = [];
        function qb(a, b) {
          pb[a] = { input: [], output: [], kb: b };
          rb(a, sb);
        }
        var sb = { open(a) {
          var b = pb[a.node.nb];
          if (!b)
            throw new N(43);
          a.Va = b;
          a.seekable = false;
        }, close(a) {
          a.Va.kb.lb(a.Va);
        }, lb(a) {
          a.Va.kb.lb(a.Va);
        }, read(a, b, c, d) {
          if (!a.Va || !a.Va.kb.Qb)
            throw new N(60);
          for (var e = 0, g = 0; g < d; g++) {
            try {
              var h = a.Va.kb.Qb(a.Va);
            } catch (q) {
              throw new N(29);
            }
            if (void 0 === h && 0 === e)
              throw new N(6);
            if (null === h || void 0 === h)
              break;
            e++;
            b[c + g] = h;
          }
          e && (a.node.$a = Date.now());
          return e;
        }, write(a, b, c, d) {
          if (!a.Va || !a.Va.kb.Hb)
            throw new N(60);
          try {
            for (var e = 0; e < d; e++)
              a.Va.kb.Hb(a.Va, b[c + e]);
          } catch (g) {
            throw new N(29);
          }
          d && (a.node.Ua = a.node.Ta = Date.now());
          return e;
        } }, tb = { Qb() {
          a: {
            if (!fb.length) {
              var a = null;
              globalThis.window?.prompt && (a = window.prompt("Input: "), null !== a && (a += "\n"));
              if (!a) {
                var b = null;
                break a;
              }
              b = Array(gb(a) + 1);
              a = M(a, b, 0, b.length);
              b.length = a;
              fb = b;
            }
            b = fb.shift();
          }
          return b;
        }, Hb(a, b) {
          null === b || 10 === b ? (Aa(db(a.output)), a.output = []) : 0 != b && a.output.push(b);
        }, lb(a) {
          0 < a.output?.length && (Aa(db(a.output)), a.output = []);
        }, Dc() {
          return { yc: 25856, Ac: 5, xc: 191, zc: 35387, wc: [
            3,
            28,
            127,
            21,
            4,
            0,
            1,
            0,
            17,
            19,
            26,
            0,
            18,
            15,
            23,
            22,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
          ] };
        }, Ec() {
          return 0;
        }, Fc() {
          return [24, 80];
        } }, ub = { Hb(a, b) {
          null === b || 10 === b ? (B(db(a.output)), a.output = []) : 0 != b && a.output.push(b);
        }, lb(a) {
          0 < a.output?.length && (B(db(a.output)), a.output = []);
        } }, O = { Za: null, ab() {
          return O.createNode(null, "/", 16895, 0);
        }, createNode(a, b, c, d) {
          if (24576 === (c & 61440) || 4096 === (c & 61440))
            throw new N(63);
          O.Za || (O.Za = { dir: { node: { Wa: O.La.Wa, Xa: O.La.Xa, mb: O.La.mb, rb: O.La.rb, Tb: O.La.Tb, xb: O.La.xb, vb: O.La.vb, Ib: O.La.Ib, wb: O.La.wb }, stream: { Ya: O.Ma.Ya } }, file: {
            node: { Wa: O.La.Wa, Xa: O.La.Xa },
            stream: { Ya: O.Ma.Ya, read: O.Ma.read, write: O.Ma.write, sb: O.Ma.sb, tb: O.Ma.tb }
          }, link: { node: { Wa: O.La.Wa, Xa: O.La.Xa, eb: O.La.eb }, stream: {} }, Nb: { node: { Wa: O.La.Wa, Xa: O.La.Xa }, stream: vb } });
          c = wb(a, b, c, d);
          P(c.mode) ? (c.La = O.Za.dir.node, c.Ma = O.Za.dir.stream, c.Na = {}) : 32768 === (c.mode & 61440) ? (c.La = O.Za.file.node, c.Ma = O.Za.file.stream, c.Ra = 0, c.Na = null) : 40960 === (c.mode & 61440) ? (c.La = O.Za.link.node, c.Ma = O.Za.link.stream) : 8192 === (c.mode & 61440) && (c.La = O.Za.Nb.node, c.Ma = O.Za.Nb.stream);
          c.$a = c.Ua = c.Ta = Date.now();
          a && (a.Na[b] = c, a.$a = a.Ua = a.Ta = c.$a);
          return c;
        }, Cc(a) {
          return a.Na ? a.Na.subarray ? a.Na.subarray(0, a.Ra) : new Uint8Array(a.Na) : new Uint8Array(0);
        }, La: { Wa(a) {
          var b = {};
          b.cc = 8192 === (a.mode & 61440) ? a.id : 1;
          b.oc = a.id;
          b.mode = a.mode;
          b.rc = 1;
          b.uid = 0;
          b.nc = 0;
          b.nb = a.nb;
          P(a.mode) ? b.size = 4096 : 32768 === (a.mode & 61440) ? b.size = a.Ra : 40960 === (a.mode & 61440) ? b.size = a.link.length : b.size = 0;
          b.$a = new Date(a.$a);
          b.Ua = new Date(a.Ua);
          b.Ta = new Date(a.Ta);
          b.Zb = 4096;
          b.$b = Math.ceil(b.size / b.Zb);
          return b;
        }, Xa(a, b) {
          for (var c of ["mode", "atime", "mtime", "ctime"])
            null != b[c] && (a[c] = b[c]);
          void 0 !== b.size && (b = b.size, a.Ra != b && (0 == b ? (a.Na = null, a.Ra = 0) : (c = a.Na, a.Na = new Uint8Array(b), c && a.Na.set(c.subarray(0, Math.min(b, a.Ra))), a.Ra = b)));
        }, mb() {
          O.zb || (O.zb = new N(44), O.zb.stack = "<generic error, no stack>");
          throw O.zb;
        }, rb(a, b, c, d) {
          return O.createNode(a, b, c, d);
        }, Tb(a, b, c) {
          try {
            var d = Q(b, c);
          } catch (g) {
          }
          if (d) {
            if (P(a.mode))
              for (var e in d.Na)
                throw new N(55);
            xb(d);
          }
          delete a.parent.Na[a.name];
          b.Na[c] = a;
          a.name = c;
          b.Ta = b.Ua = a.parent.Ta = a.parent.Ua = Date.now();
        }, xb(a, b) {
          delete a.Na[b];
          a.Ta = a.Ua = Date.now();
        }, vb(a, b) {
          var c = Q(a, b), d;
          for (d in c.Na)
            throw new N(55);
          delete a.Na[b];
          a.Ta = a.Ua = Date.now();
        }, Ib(a) {
          return [".", "..", ...Object.keys(a.Na)];
        }, wb(a, b, c) {
          a = O.createNode(a, b, 41471, 0);
          a.link = c;
          return a;
        }, eb(a) {
          if (40960 !== (a.mode & 61440))
            throw new N(28);
          return a.link;
        } }, Ma: { read(a, b, c, d, e) {
          var g = a.node.Na;
          if (e >= a.node.Ra)
            return 0;
          a = Math.min(a.node.Ra - e, d);
          if (8 < a && g.subarray)
            b.set(g.subarray(e, e + a), c);
          else
            for (d = 0; d < a; d++)
              b[c + d] = g[e + d];
          return a;
        }, write(a, b, c, d, e, g) {
          b.buffer === m.buffer && (g = false);
          if (!d)
            return 0;
          a = a.node;
          a.Ua = a.Ta = Date.now();
          if (b.subarray && (!a.Na || a.Na.subarray)) {
            if (g)
              return a.Na = b.subarray(c, c + d), a.Ra = d;
            if (0 === a.Ra && 0 === e)
              return a.Na = b.slice(c, c + d), a.Ra = d;
            if (e + d <= a.Ra)
              return a.Na.set(b.subarray(c, c + d), e), d;
          }
          g = e + d;
          var h = a.Na ? a.Na.length : 0;
          h >= g || (g = Math.max(g, h * (1048576 > h ? 2 : 1.125) >>> 0), 0 != h && (g = Math.max(g, 256)), h = a.Na, a.Na = new Uint8Array(g), 0 < a.Ra && a.Na.set(h.subarray(0, a.Ra), 0));
          if (a.Na.subarray && b.subarray)
            a.Na.set(b.subarray(c, c + d), e);
          else
            for (g = 0; g < d; g++)
              a.Na[e + g] = b[c + g];
          a.Ra = Math.max(
            a.Ra,
            e + d
          );
          return d;
        }, Ya(a, b, c) {
          1 === c ? b += a.position : 2 === c && 32768 === (a.node.mode & 61440) && (b += a.node.Ra);
          if (0 > b)
            throw new N(28);
          return b;
        }, sb(a, b, c, d, e) {
          if (32768 !== (a.node.mode & 61440))
            throw new N(43);
          a = a.node.Na;
          if (e & 2 || !a || a.buffer !== m.buffer) {
            e = true;
            d = 65536 * Math.ceil(b / 65536);
            var g = yb(65536, d);
            g && C.fill(0, g, g + d);
            d = g;
            if (!d)
              throw new N(48);
            if (a) {
              if (0 < c || c + b < a.length)
                a.subarray ? a = a.subarray(c, c + b) : a = Array.prototype.slice.call(a, c, c + b);
              m.set(a, d);
            }
          } else
            e = false, d = a.byteOffset;
          return { tc: d, Ub: e };
        }, tb(a, b, c, d) {
          O.Ma.write(
            a,
            b,
            0,
            d,
            c,
            false
          );
          return 0;
        } } }, ia = (a, b) => {
          var c = 0;
          a && (c |= 365);
          b && (c |= 146);
          return c;
        }, zb = null, Ab = {}, Bb = [], Cb = 1, R = null, Db = false, Eb = true, N = class {
          constructor(a) {
            __publicField(this, "name", "ErrnoError");
            this.Pa = a;
          }
        }, Fb = class {
          constructor() {
            __publicField(this, "qb", {});
            __publicField(this, "node", null);
          }
          get flags() {
            return this.qb.flags;
          }
          set flags(a) {
            this.qb.flags = a;
          }
          get position() {
            return this.qb.position;
          }
          set position(a) {
            this.qb.position = a;
          }
        }, Gb = class {
          constructor(a, b, c, d) {
            __publicField(this, "La", {});
            __publicField(this, "Ma", {});
            __publicField(this, "ib", null);
            a || (a = this);
            this.parent = a;
            this.ab = a.ab;
            this.id = Cb++;
            this.name = b;
            this.mode = c;
            this.nb = d;
            this.$a = this.Ua = this.Ta = Date.now();
          }
          get read() {
            return 365 === (this.mode & 365);
          }
          set read(a) {
            a ? this.mode |= 365 : this.mode &= -366;
          }
          get write() {
            return 146 === (this.mode & 146);
          }
          set write(a) {
            a ? this.mode |= 146 : this.mode &= -147;
          }
        };
        function S(a, b = {}) {
          if (!a)
            throw new N(44);
          b.Bb ?? (b.Bb = true);
          "/" === a.charAt(0) || (a = "//" + a);
          var c = 0;
          a:
            for (; 40 > c; c++) {
              a = a.split("/").filter((q) => !!q);
              for (var d = zb, e = "/", g = 0; g < a.length; g++) {
                var h = g === a.length - 1;
                if (h && b.parent)
                  break;
                if ("." !== a[g])
                  if (".." === a[g])
                    if (e = Za(e), d === d.parent) {
                      a = e + "/" + a.slice(g + 1).join("/");
                      c--;
                      continue a;
                    } else
                      d = d.parent;
                  else {
                    e = ha(e + "/" + a[g]);
                    try {
                      d = Q(d, a[g]);
                    } catch (q) {
                      if (44 === q?.Pa && h && b.sc)
                        return { path: e };
                      throw q;
                    }
                    !d.ib || h && !b.Bb || (d = d.ib.root);
                    if (40960 === (d.mode & 61440) && (!h || b.hb)) {
                      if (!d.La.eb)
                        throw new N(52);
                      d = d.La.eb(d);
                      "/" === d.charAt(0) || (d = Za(e) + "/" + d);
                      a = d + "/" + a.slice(g + 1).join("/");
                      continue a;
                    }
                  }
              }
              return { path: e, node: d };
            }
          throw new N(32);
        }
        function fa(a) {
          for (var b; ; ) {
            if (a === a.parent)
              return a = a.ab.Sb, b ? "/" !== a[a.length - 1] ? `${a}/${b}` : a + b : a;
            b = b ? `${a.name}/${b}` : a.name;
            a = a.parent;
          }
        }
        function Hb(a, b) {
          for (var c = 0, d = 0; d < b.length; d++)
            c = (c << 5) - c + b.charCodeAt(d) | 0;
          return (a + c >>> 0) % R.length;
        }
        function xb(a) {
          var b = Hb(a.parent.id, a.name);
          if (R[b] === a)
            R[b] = a.jb;
          else
            for (b = R[b]; b; ) {
              if (b.jb === a) {
                b.jb = a.jb;
                break;
              }
              b = b.jb;
            }
        }
        function Q(a, b) {
          var c = P(a.mode) ? (c = Ib(a, "x")) ? c : a.La.mb ? 0 : 2 : 54;
          if (c)
            throw new N(c);
          for (c = R[Hb(a.id, b)]; c; c = c.jb) {
            var d = c.name;
            if (c.parent.id === a.id && d === b)
              return c;
          }
          return a.La.mb(a, b);
        }
        function wb(a, b, c, d) {
          a = new Gb(a, b, c, d);
          b = Hb(a.parent.id, a.name);
          a.jb = R[b];
          return R[b] = a;
        }
        function P(a) {
          return 16384 === (a & 61440);
        }
        function Ib(a, b) {
          return Eb ? 0 : b.includes("r") && !(a.mode & 292) || b.includes("w") && !(a.mode & 146) || b.includes("x") && !(a.mode & 73) ? 2 : 0;
        }
        function Jb(a, b) {
          if (!P(a.mode))
            return 54;
          try {
            return Q(a, b), 20;
          } catch (c) {
          }
          return Ib(a, "wx");
        }
        function Kb(a, b, c) {
          try {
            var d = Q(a, b);
          } catch (e) {
            return e.Pa;
          }
          if (a = Ib(a, "wx"))
            return a;
          if (c) {
            if (!P(d.mode))
              return 54;
            if (d === d.parent || "/" === fa(d))
              return 10;
          } else if (P(d.mode))
            return 31;
          return 0;
        }
        function Lb(a) {
          if (!a)
            throw new N(63);
          return a;
        }
        function T(a) {
          a = Bb[a];
          if (!a)
            throw new N(8);
          return a;
        }
        function Mb(a, b = -1) {
          a = Object.assign(new Fb(), a);
          if (-1 == b)
            a: {
              for (b = 0; 4096 >= b; b++)
                if (!Bb[b])
                  break a;
              throw new N(33);
            }
          a.bb = b;
          return Bb[b] = a;
        }
        function Nb(a, b = -1) {
          a = Mb(a, b);
          a.Ma?.Bc?.(a);
          return a;
        }
        function Ob(a, b, c) {
          var d = a?.Ma.Xa;
          a = d ? a : b;
          d ?? (d = b.La.Xa);
          Lb(d);
          d(a, c);
        }
        var vb = { open(a) {
          a.Ma = Ab[a.node.nb].Ma;
          a.Ma.open?.(a);
        }, Ya() {
          throw new N(70);
        } };
        function rb(a, b) {
          Ab[a] = { Ma: b };
        }
        function Pb(a, b) {
          var c = "/" === b;
          if (c && zb)
            throw new N(10);
          if (!c && b) {
            var d = S(b, { Bb: false });
            b = d.path;
            d = d.node;
            if (d.ib)
              throw new N(10);
            if (!P(d.mode))
              throw new N(54);
          }
          b = { type: a, Gc: {}, Sb: b, qc: [] };
          a = a.ab(b);
          a.ab = b;
          b.root = a;
          c ? zb = a : d && (d.ib = b, d.ab && d.ab.qc.push(b));
        }
        function Qb(a, b, c) {
          var d = S(a, { parent: true }).node;
          a = $a(a);
          if (!a)
            throw new N(28);
          if ("." === a || ".." === a)
            throw new N(20);
          var e = Jb(d, a);
          if (e)
            throw new N(e);
          if (!d.La.rb)
            throw new N(63);
          return d.La.rb(d, a, b, c);
        }
        function ja(a, b = 438) {
          return Qb(a, b & 4095 | 32768, 0);
        }
        function U(a, b = 511) {
          return Qb(a, b & 1023 | 16384, 0);
        }
        function Rb(a, b, c) {
          "undefined" == typeof c && (c = b, b = 438);
          Qb(a, b | 8192, c);
        }
        function Sb(a, b) {
          if (!cb(a))
            throw new N(44);
          var c = S(b, { parent: true }).node;
          if (!c)
            throw new N(44);
          b = $a(b);
          var d = Jb(c, b);
          if (d)
            throw new N(d);
          if (!c.La.wb)
            throw new N(63);
          c.La.wb(c, b, a);
        }
        function Tb(a) {
          var b = S(a, { parent: true }).node;
          a = $a(a);
          var c = Q(b, a), d = Kb(b, a, true);
          if (d)
            throw new N(d);
          if (!b.La.vb)
            throw new N(63);
          if (c.ib)
            throw new N(10);
          b.La.vb(b, a);
          xb(c);
        }
        function ta(a) {
          var b = S(a, { parent: true }).node;
          if (!b)
            throw new N(44);
          a = $a(a);
          var c = Q(b, a), d = Kb(b, a, false);
          if (d)
            throw new N(d);
          if (!b.La.xb)
            throw new N(63);
          if (c.ib)
            throw new N(10);
          b.La.xb(b, a);
          xb(c);
        }
        function Ub(a, b) {
          a = S(a, { hb: !b }).node;
          return Lb(a.La.Wa)(a);
        }
        function Vb(a, b, c, d) {
          Ob(a, b, { mode: c & 4095 | b.mode & -4096, Ta: Date.now(), dc: d });
        }
        function ka(a, b) {
          a = "string" == typeof a ? S(a, { hb: true }).node : a;
          Vb(null, a, b);
        }
        function Wb(a, b, c) {
          if (P(b.mode))
            throw new N(31);
          if (32768 !== (b.mode & 61440))
            throw new N(28);
          var d = Ib(b, "w");
          if (d)
            throw new N(d);
          Ob(a, b, { size: c, timestamp: Date.now() });
        }
        function la(a, b, c = 438) {
          if ("" === a)
            throw new N(44);
          if ("string" == typeof b) {
            var d = { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 }[b];
            if ("undefined" == typeof d)
              throw Error(`Unknown file open mode: ${b}`);
            b = d;
          }
          c = b & 64 ? c & 4095 | 32768 : 0;
          if ("object" == typeof a)
            d = a;
          else {
            var e = a.endsWith("/");
            var g = S(a, { hb: !(b & 131072), sc: true });
            d = g.node;
            a = g.path;
          }
          g = false;
          if (b & 64)
            if (d) {
              if (b & 128)
                throw new N(20);
            } else {
              if (e)
                throw new N(31);
              d = Qb(a, c | 511, 0);
              g = true;
            }
          if (!d)
            throw new N(44);
          8192 === (d.mode & 61440) && (b &= -513);
          if (b & 65536 && !P(d.mode))
            throw new N(54);
          if (!g && (d ? 40960 === (d.mode & 61440) ? e = 32 : (e = ["r", "w", "rw"][b & 3], b & 512 && (e += "w"), e = P(d.mode) && ("r" !== e || b & 576) ? 31 : Ib(d, e)) : e = 44, e))
            throw new N(e);
          b & 512 && !g && (e = d, e = "string" == typeof e ? S(e, { hb: true }).node : e, Wb(null, e, 0));
          b = Mb({ node: d, path: fa(d), flags: b & -131713, seekable: true, position: 0, Ma: d.Ma, uc: [], error: false });
          b.Ma.open && b.Ma.open(b);
          g && ka(d, c & 511);
          return b;
        }
        function na(a) {
          if (null === a.bb)
            throw new N(8);
          a.Eb && (a.Eb = null);
          try {
            a.Ma.close && a.Ma.close(a);
          } catch (b) {
            throw b;
          } finally {
            Bb[a.bb] = null;
          }
          a.bb = null;
        }
        function Xb(a, b, c) {
          if (null === a.bb)
            throw new N(8);
          if (!a.seekable || !a.Ma.Ya)
            throw new N(70);
          if (0 != c && 1 != c && 2 != c)
            throw new N(28);
          a.position = a.Ma.Ya(a, b, c);
          a.uc = [];
        }
        function Yb(a, b, c, d, e) {
          if (0 > d || 0 > e)
            throw new N(28);
          if (null === a.bb)
            throw new N(8);
          if (1 === (a.flags & 2097155))
            throw new N(8);
          if (P(a.node.mode))
            throw new N(31);
          if (!a.Ma.read)
            throw new N(28);
          var g = "undefined" != typeof e;
          if (!g)
            e = a.position;
          else if (!a.seekable)
            throw new N(70);
          b = a.Ma.read(a, b, c, d, e);
          g || (a.position += b);
          return b;
        }
        function ma(a, b, c, d, e) {
          if (0 > d || 0 > e)
            throw new N(28);
          if (null === a.bb)
            throw new N(8);
          if (0 === (a.flags & 2097155))
            throw new N(8);
          if (P(a.node.mode))
            throw new N(31);
          if (!a.Ma.write)
            throw new N(28);
          a.seekable && a.flags & 1024 && Xb(a, 0, 2);
          var g = "undefined" != typeof e;
          if (!g)
            e = a.position;
          else if (!a.seekable)
            throw new N(70);
          b = a.Ma.write(a, b, c, d, e, void 0);
          g || (a.position += b);
          return b;
        }
        function sa(a) {
          var b = b || 0;
          var c = "binary";
          "utf8" !== c && "binary" !== c && Ja(`Invalid encoding type "${c}"`);
          b = la(a, b);
          a = Ub(a).size;
          var d = new Uint8Array(a);
          Yb(b, d, 0, a, 0);
          "utf8" === c && (d = db(d));
          na(b);
          return d;
        }
        function W(a, b, c) {
          a = ha("/dev/" + a);
          var d = ia(!!b, !!c);
          W.Rb ?? (W.Rb = 64);
          var e = W.Rb++ << 8 | 0;
          rb(e, { open(g) {
            g.seekable = false;
          }, close() {
            c?.buffer?.length && c(10);
          }, read(g, h, q, w) {
            for (var t = 0, x = 0; x < w; x++) {
              try {
                var D = b();
              } catch (ib) {
                throw new N(29);
              }
              if (void 0 === D && 0 === t)
                throw new N(6);
              if (null === D || void 0 === D)
                break;
              t++;
              h[q + x] = D;
            }
            t && (g.node.$a = Date.now());
            return t;
          }, write(g, h, q, w) {
            for (var t = 0; t < w; t++)
              try {
                c(h[q + t]);
              } catch (x) {
                throw new N(29);
              }
            w && (g.node.Ua = g.node.Ta = Date.now());
            return t;
          } });
          Rb(a, d, e);
        }
        var X = {};
        function Y(a, b, c) {
          if ("/" === b.charAt(0))
            return b;
          a = -100 === a ? "/" : T(a).path;
          if (0 == b.length) {
            if (!c)
              throw new N(44);
            return a;
          }
          return a + "/" + b;
        }
        function Zb(a, b) {
          F[a >> 2] = b.cc;
          F[a + 4 >> 2] = b.mode;
          F[a + 8 >> 2] = b.rc;
          F[a + 12 >> 2] = b.uid;
          F[a + 16 >> 2] = b.nc;
          F[a + 20 >> 2] = b.nb;
          G[a + 24 >> 3] = BigInt(b.size);
          E[a + 32 >> 2] = 4096;
          E[a + 36 >> 2] = b.$b;
          var c = b.$a.getTime(), d = b.Ua.getTime(), e = b.Ta.getTime();
          G[a + 40 >> 3] = BigInt(Math.floor(c / 1e3));
          F[a + 48 >> 2] = c % 1e3 * 1e6;
          G[a + 56 >> 3] = BigInt(Math.floor(d / 1e3));
          F[a + 64 >> 2] = d % 1e3 * 1e6;
          G[a + 72 >> 3] = BigInt(Math.floor(e / 1e3));
          F[a + 80 >> 2] = e % 1e3 * 1e6;
          G[a + 88 >> 3] = BigInt(b.oc);
          return 0;
        }
        var ic = void 0, Ac = () => {
          var a = E[+ic >> 2];
          ic += 4;
          return a;
        }, Cc = 0, Dc = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], Ec = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], Fc = {}, Gc = (a) => {
          if (!(a instanceof Pa || "unwind" == a))
            throw a;
        }, Hc = (a) => {
          Da = a;
          Va || 0 < Cc || (k.onExit?.(a), Ca = true);
          throw new Pa(a);
        }, Ic = (a) => {
          if (!Ca)
            try {
              a();
            } catch (b) {
              Gc(b);
            } finally {
              if (!(Va || 0 < Cc))
                try {
                  Da = a = Da, Hc(a);
                } catch (b) {
                  Gc(b);
                }
            }
        }, Jc = {}, Lc = () => {
          if (!Kc) {
            var a = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8", _: va || "./this.program" }, b;
            for (b in Jc)
              void 0 === Jc[b] ? delete a[b] : a[b] = Jc[b];
            var c = [];
            for (b in a)
              c.push(`${b}=${a[b]}`);
            Kc = c;
          }
          return Kc;
        }, Kc, Mc = (a, b, c, d) => {
          var e = { string: (t) => {
            var x = 0;
            if (null !== t && void 0 !== t && 0 !== t) {
              x = gb(t) + 1;
              var D = y(x);
              M(t, C, D, x);
              x = D;
            }
            return x;
          }, array: (t) => {
            var x = y(t.length);
            m.set(t, x);
            return x;
          } };
          a = k["_" + a];
          var g = [], h = 0;
          if (d)
            for (var q = 0; q < d.length; q++) {
              var w = e[c[q]];
              w ? (0 === h && (h = oa()), g[q] = w(d[q])) : g[q] = d[q];
            }
          c = a(...g);
          return c = function(t) {
            0 !== h && qa(h);
            return "string" === b ? z(t) : "boolean" === b ? !!t : t;
          }(c);
        }, ea = (a) => {
          var b = gb(a) + 1, c = ca(b);
          c && M(a, C, c, b);
          return c;
        }, Nc, Oc = [], A = (a) => {
          Nc.delete(Z.get(a));
          Z.set(a, null);
          Oc.push(a);
        }, Pc = (a) => {
          const b = a.length;
          return [b % 128 | 128, b >> 7, ...a];
        }, Qc = { i: 127, p: 127, j: 126, f: 125, d: 124, e: 111 }, Rc = (a) => Pc(Array.from(a, (b) => Qc[b])), ua = (a, b) => {
          if (!Nc) {
            Nc = /* @__PURE__ */ new WeakMap();
            var c = Z.length;
            if (Nc)
              for (var d = 0; d < 0 + c; d++) {
                var e = Z.get(d);
                e && Nc.set(e, d);
              }
          }
          if (c = Nc.get(a) || 0)
            return c;
          c = Oc.length ? Oc.pop() : Z.grow(1);
          try {
            Z.set(c, a);
          } catch (g) {
            if (!(g instanceof TypeError))
              throw g;
            b = Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0, 1, ...Pc([1, 96, ...Rc(b.slice(1)), ...Rc("v" === b[0] ? "" : b[0])]), 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
            b = new WebAssembly.Module(b);
            b = new WebAssembly.Instance(b, { e: { f: a } }).exports.f;
            Z.set(c, b);
          }
          Nc.set(a, c);
          return c;
        };
        R = Array(4096);
        Pb(O, "/");
        U("/tmp");
        U("/home");
        U("/home/web_user");
        (function() {
          U("/dev");
          rb(259, { read: () => 0, write: (d, e, g, h) => h, Ya: () => 0 });
          Rb("/dev/null", 259);
          qb(1280, tb);
          qb(1536, ub);
          Rb("/dev/tty", 1280);
          Rb("/dev/tty1", 1536);
          var a = new Uint8Array(1024), b = 0, c = () => {
            0 === b && (bb(a), b = a.byteLength);
            return a[--b];
          };
          W("random", c);
          W("urandom", c);
          U("/dev/shm");
          U("/dev/shm/tmp");
        })();
        (function() {
          U("/proc");
          var a = U("/proc/self");
          U("/proc/self/fd");
          Pb({ ab() {
            var b = wb(a, "fd", 16895, 73);
            b.Ma = { Ya: O.Ma.Ya };
            b.La = { mb(c, d) {
              c = +d;
              var e = T(c);
              c = { parent: null, ab: { Sb: "fake" }, La: { eb: () => e.path }, id: c + 1 };
              return c.parent = c;
            }, Ib() {
              return Array.from(Bb.entries()).filter(([, c]) => c).map(([c]) => c.toString());
            } };
            return b;
          } }, "/proc/self/fd");
        })();
        k.noExitRuntime && (Va = k.noExitRuntime);
        k.print && (Aa = k.print);
        k.printErr && (B = k.printErr);
        k.wasmBinary && (Ba = k.wasmBinary);
        k.thisProgram && (va = k.thisProgram);
        if (k.preInit)
          for ("function" == typeof k.preInit && (k.preInit = [k.preInit]); 0 < k.preInit.length; )
            k.preInit.shift()();
        k.stackSave = () => oa();
        k.stackRestore = (a) => qa(a);
        k.stackAlloc = (a) => y(a);
        k.cwrap = (a, b, c, d) => {
          var e = !c || c.every((g) => "number" === g || "boolean" === g);
          return "string" !== b && e && !d ? k["_" + a] : (...g) => Mc(a, b, c, g);
        };
        k.addFunction = ua;
        k.removeFunction = A;
        k.UTF8ToString = z;
        k.stringToNewUTF8 = ea;
        k.writeArrayToMemory = (a, b) => {
          m.set(a, b);
        };
        var ca, da, yb, Sc, qa, y, oa, Ia, Z, Tc = {
          a: (a, b, c, d) => Ja(`Assertion failed: ${z(a)}, at: ` + [b ? z(b) : "unknown filename", c, d ? z(d) : "unknown function"]),
          i: function(a, b) {
            try {
              return a = z(a), ka(a, b), 0;
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name)
                throw c;
              return -c.Pa;
            }
          },
          L: function(a, b, c) {
            try {
              b = z(b);
              b = Y(a, b);
              if (c & -8)
                return -28;
              var d = S(b, { hb: true }).node;
              if (!d)
                return -44;
              a = "";
              c & 4 && (a += "r");
              c & 2 && (a += "w");
              c & 1 && (a += "x");
              return a && Ib(d, a) ? -2 : 0;
            } catch (e) {
              if ("undefined" == typeof X || "ErrnoError" !== e.name)
                throw e;
              return -e.Pa;
            }
          },
          j: function(a, b) {
            try {
              var c = T(a);
              Vb(c, c.node, b, false);
              return 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name)
                throw d;
              return -d.Pa;
            }
          },
          h: function(a) {
            try {
              var b = T(a);
              Ob(b, b.node, { timestamp: Date.now(), dc: false });
              return 0;
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name)
                throw c;
              return -c.Pa;
            }
          },
          b: function(a, b, c) {
            ic = c;
            try {
              var d = T(a);
              switch (b) {
                case 0:
                  var e = Ac();
                  if (0 > e)
                    break;
                  for (; Bb[e]; )
                    e++;
                  return Nb(d, e).bb;
                case 1:
                case 2:
                  return 0;
                case 3:
                  return d.flags;
                case 4:
                  return e = Ac(), d.flags |= e, 0;
                case 12:
                  return e = Ac(), Ea[e + 0 >> 1] = 2, 0;
                case 13:
                case 14:
                  return 0;
              }
              return -28;
            } catch (g) {
              if ("undefined" == typeof X || "ErrnoError" !== g.name)
                throw g;
              return -g.Pa;
            }
          },
          g: function(a, b) {
            try {
              var c = T(a), d = c.node, e = c.Ma.Wa;
              a = e ? c : d;
              e ?? (e = d.La.Wa);
              Lb(e);
              var g = e(a);
              return Zb(b, g);
            } catch (h) {
              if ("undefined" == typeof X || "ErrnoError" !== h.name)
                throw h;
              return -h.Pa;
            }
          },
          H: function(a, b) {
            b = -9007199254740992 > b || 9007199254740992 < b ? NaN : Number(b);
            try {
              if (isNaN(b))
                return -61;
              var c = T(a);
              if (0 > b || 0 === (c.flags & 2097155))
                throw new N(28);
              Wb(c, c.node, b);
              return 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name)
                throw d;
              return -d.Pa;
            }
          },
          G: function(a, b) {
            try {
              if (0 === b)
                return -28;
              var c = gb("/") + 1;
              if (b < c)
                return -68;
              M("/", C, a, b);
              return c;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name)
                throw d;
              return -d.Pa;
            }
          },
          K: function(a, b) {
            try {
              return a = z(a), Zb(b, Ub(a, true));
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name)
                throw c;
              return -c.Pa;
            }
          },
          C: function(a, b, c) {
            try {
              return b = z(b), b = Y(a, b), U(b, c), 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name)
                throw d;
              return -d.Pa;
            }
          },
          J: function(a, b, c, d) {
            try {
              b = z(b);
              var e = d & 256;
              b = Y(a, b, d & 4096);
              return Zb(c, e ? Ub(b, true) : Ub(b));
            } catch (g) {
              if ("undefined" == typeof X || "ErrnoError" !== g.name)
                throw g;
              return -g.Pa;
            }
          },
          x: function(a, b, c, d) {
            ic = d;
            try {
              b = z(b);
              b = Y(a, b);
              var e = d ? Ac() : 0;
              return la(b, c, e).bb;
            } catch (g) {
              if ("undefined" == typeof X || "ErrnoError" !== g.name)
                throw g;
              return -g.Pa;
            }
          },
          v: function(a, b, c, d) {
            try {
              b = z(b);
              b = Y(a, b);
              if (0 >= d)
                return -28;
              var e = S(b).node;
              if (!e)
                throw new N(44);
              if (!e.La.eb)
                throw new N(28);
              var g = e.La.eb(e);
              var h = Math.min(d, gb(g)), q = m[c + h];
              M(g, C, c, d + 1);
              m[c + h] = q;
              return h;
            } catch (w) {
              if ("undefined" == typeof X || "ErrnoError" !== w.name)
                throw w;
              return -w.Pa;
            }
          },
          u: function(a) {
            try {
              return a = z(a), Tb(a), 0;
            } catch (b) {
              if ("undefined" == typeof X || "ErrnoError" !== b.name)
                throw b;
              return -b.Pa;
            }
          },
          f: function(a, b) {
            try {
              return a = z(a), Zb(b, Ub(a));
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name)
                throw c;
              return -c.Pa;
            }
          },
          r: function(a, b, c) {
            try {
              b = z(b);
              b = Y(a, b);
              if (c)
                if (512 === c)
                  Tb(b);
                else
                  return -28;
              else
                ta(b);
              return 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name)
                throw d;
              return -d.Pa;
            }
          },
          q: function(a, b, c) {
            try {
              b = z(b);
              b = Y(a, b, true);
              var d = Date.now(), e, g;
              if (c) {
                var h = F[c >> 2] + 4294967296 * E[c + 4 >> 2], q = E[c + 8 >> 2];
                1073741823 == q ? e = d : 1073741822 == q ? e = null : e = 1e3 * h + q / 1e6;
                c += 16;
                h = F[c >> 2] + 4294967296 * E[c + 4 >> 2];
                q = E[c + 8 >> 2];
                1073741823 == q ? g = d : 1073741822 == q ? g = null : g = 1e3 * h + q / 1e6;
              } else
                g = e = d;
              if (null !== (g ?? e)) {
                a = e;
                var w = S(b, { hb: true }).node;
                Lb(w.La.Xa)(w, { $a: a, Ua: g });
              }
              return 0;
            } catch (t) {
              if ("undefined" == typeof X || "ErrnoError" !== t.name)
                throw t;
              return -t.Pa;
            }
          },
          m: () => Ja(""),
          l: () => {
            Va = false;
            Cc = 0;
          },
          A: function(a, b) {
            a = -9007199254740992 > a || 9007199254740992 < a ? NaN : Number(a);
            a = new Date(1e3 * a);
            E[b >> 2] = a.getSeconds();
            E[b + 4 >> 2] = a.getMinutes();
            E[b + 8 >> 2] = a.getHours();
            E[b + 12 >> 2] = a.getDate();
            E[b + 16 >> 2] = a.getMonth();
            E[b + 20 >> 2] = a.getFullYear() - 1900;
            E[b + 24 >> 2] = a.getDay();
            var c = a.getFullYear();
            E[b + 28 >> 2] = (0 !== c % 4 || 0 === c % 100 && 0 !== c % 400 ? Ec : Dc)[a.getMonth()] + a.getDate() - 1 | 0;
            E[b + 36 >> 2] = -(60 * a.getTimezoneOffset());
            c = new Date(a.getFullYear(), 6, 1).getTimezoneOffset();
            var d = new Date(a.getFullYear(), 0, 1).getTimezoneOffset();
            E[b + 32 >> 2] = (c != d && a.getTimezoneOffset() == Math.min(d, c)) | 0;
          },
          y: function(a, b, c, d, e, g, h) {
            e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e);
            try {
              var q = T(d);
              if (0 !== (b & 2) && 0 === (c & 2) && 2 !== (q.flags & 2097155))
                throw new N(2);
              if (1 === (q.flags & 2097155))
                throw new N(2);
              if (!q.Ma.sb)
                throw new N(43);
              if (!a)
                throw new N(28);
              var w = q.Ma.sb(q, a, e, b, c);
              var t = w.tc;
              E[g >> 2] = w.Ub;
              F[h >> 2] = t;
              return 0;
            } catch (x) {
              if ("undefined" == typeof X || "ErrnoError" !== x.name)
                throw x;
              return -x.Pa;
            }
          },
          z: function(a, b, c, d, e, g) {
            g = -9007199254740992 > g || 9007199254740992 < g ? NaN : Number(g);
            try {
              var h = T(e);
              if (c & 2) {
                if (32768 !== (h.node.mode & 61440))
                  throw new N(43);
                d & 2 || h.Ma.tb && h.Ma.tb(h, C.slice(a, a + b), g, b, d);
              }
            } catch (q) {
              if ("undefined" == typeof X || "ErrnoError" !== q.name)
                throw q;
              return -q.Pa;
            }
          },
          n: (a, b) => {
            Fc[a] && (clearTimeout(Fc[a].id), delete Fc[a]);
            if (!b)
              return 0;
            var c = setTimeout(() => {
              delete Fc[a];
              Ic(() => Sc(a, performance.now()));
            }, b);
            Fc[a] = { id: c, Hc: b };
            return 0;
          },
          B: (a, b, c, d) => {
            var e = (/* @__PURE__ */ new Date()).getFullYear(), g = new Date(e, 0, 1).getTimezoneOffset();
            e = new Date(e, 6, 1).getTimezoneOffset();
            F[a >> 2] = 60 * Math.max(g, e);
            E[b >> 2] = Number(g != e);
            b = (h) => {
              var q = Math.abs(h);
              return `UTC${0 <= h ? "-" : "+"}${String(Math.floor(q / 60)).padStart(2, "0")}${String(q % 60).padStart(2, "0")}`;
            };
            a = b(g);
            b = b(e);
            e < g ? (M(a, C, c, 17), M(b, C, d, 17)) : (M(a, C, d, 17), M(b, C, c, 17));
          },
          d: () => Date.now(),
          s: () => 2147483648,
          c: () => performance.now(),
          o: (a) => {
            var b = C.length;
            a >>>= 0;
            if (2147483648 < a)
              return false;
            for (var c = 1; 4 >= c; c *= 2) {
              var d = b * (1 + 0.2 / c);
              d = Math.min(d, a + 100663296);
              a: {
                d = (Math.min(2147483648, 65536 * Math.ceil(Math.max(a, d) / 65536)) - Ia.buffer.byteLength + 65535) / 65536 | 0;
                try {
                  Ia.grow(d);
                  Ha();
                  var e = 1;
                  break a;
                } catch (g) {
                }
                e = void 0;
              }
              if (e)
                return true;
            }
            return false;
          },
          E: (a, b) => {
            var c = 0, d = 0, e;
            for (e of Lc()) {
              var g = b + c;
              F[a + d >> 2] = g;
              c += M(e, C, g, Infinity) + 1;
              d += 4;
            }
            return 0;
          },
          F: (a, b) => {
            var c = Lc();
            F[a >> 2] = c.length;
            a = 0;
            for (var d of c)
              a += gb(d) + 1;
            F[b >> 2] = a;
            return 0;
          },
          e: function(a) {
            try {
              var b = T(a);
              na(b);
              return 0;
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name)
                throw c;
              return c.Pa;
            }
          },
          p: function(a, b) {
            try {
              var c = T(a);
              m[b] = c.Va ? 2 : P(c.mode) ? 3 : 40960 === (c.mode & 61440) ? 7 : 4;
              Ea[b + 2 >> 1] = 0;
              G[b + 8 >> 3] = BigInt(0);
              G[b + 16 >> 3] = BigInt(0);
              return 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name)
                throw d;
              return d.Pa;
            }
          },
          w: function(a, b, c, d) {
            try {
              a: {
                var e = T(a);
                a = b;
                for (var g, h = b = 0; h < c; h++) {
                  var q = F[a >> 2], w = F[a + 4 >> 2];
                  a += 8;
                  var t = Yb(e, m, q, w, g);
                  if (0 > t) {
                    var x = -1;
                    break a;
                  }
                  b += t;
                  if (t < w)
                    break;
                  "undefined" != typeof g && (g += t);
                }
                x = b;
              }
              F[d >> 2] = x;
              return 0;
            } catch (D) {
              if ("undefined" == typeof X || "ErrnoError" !== D.name)
                throw D;
              return D.Pa;
            }
          },
          D: function(a, b, c, d) {
            b = -9007199254740992 > b || 9007199254740992 < b ? NaN : Number(b);
            try {
              if (isNaN(b))
                return 61;
              var e = T(a);
              Xb(e, b, c);
              G[d >> 3] = BigInt(e.position);
              e.Eb && 0 === b && 0 === c && (e.Eb = null);
              return 0;
            } catch (g) {
              if ("undefined" == typeof X || "ErrnoError" !== g.name)
                throw g;
              return g.Pa;
            }
          },
          I: function(a) {
            try {
              var b = T(a);
              return b.Ma?.lb?.(b);
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name)
                throw c;
              return c.Pa;
            }
          },
          t: function(a, b, c, d) {
            try {
              a: {
                var e = T(a);
                a = b;
                for (var g, h = b = 0; h < c; h++) {
                  var q = F[a >> 2], w = F[a + 4 >> 2];
                  a += 8;
                  var t = ma(e, m, q, w, g);
                  if (0 > t) {
                    var x = -1;
                    break a;
                  }
                  b += t;
                  if (t < w)
                    break;
                  "undefined" != typeof g && (g += t);
                }
                x = b;
              }
              F[d >> 2] = x;
              return 0;
            } catch (D) {
              if ("undefined" == typeof X || "ErrnoError" !== D.name)
                throw D;
              return D.Pa;
            }
          },
          k: Hc
        };
        function Uc() {
          function a() {
            k.calledRun = true;
            if (!Ca) {
              if (!k.noFSInit && !Db) {
                var b, c;
                Db = true;
                b ?? (b = k.stdin);
                c ?? (c = k.stdout);
                d ?? (d = k.stderr);
                b ? W("stdin", b) : Sb("/dev/tty", "/dev/stdin");
                c ? W("stdout", null, c) : Sb("/dev/tty", "/dev/stdout");
                d ? W("stderr", null, d) : Sb("/dev/tty1", "/dev/stderr");
                la("/dev/stdin", 0);
                la("/dev/stdout", 1);
                la("/dev/stderr", 1);
              }
              Vc.N();
              Eb = false;
              k.onRuntimeInitialized?.();
              if (k.postRun)
                for ("function" == typeof k.postRun && (k.postRun = [k.postRun]); k.postRun.length; ) {
                  var d = k.postRun.shift();
                  Ra.push(d);
                }
              Qa(Ra);
            }
          }
          if (0 < J)
            Ua = Uc;
          else {
            if (k.preRun)
              for ("function" == typeof k.preRun && (k.preRun = [k.preRun]); k.preRun.length; )
                Ta();
            Qa(Sa);
            0 < J ? Ua = Uc : k.setStatus ? (k.setStatus("Running..."), setTimeout(() => {
              setTimeout(() => k.setStatus(""), 1);
              a();
            }, 1)) : a();
          }
        }
        var Vc;
        (async function() {
          function a(c) {
            c = Vc = c.exports;
            k._sqlite3_free = c.P;
            k._sqlite3_value_text = c.Q;
            k._sqlite3_prepare_v2 = c.R;
            k._sqlite3_step = c.S;
            k._sqlite3_reset = c.T;
            k._sqlite3_exec = c.U;
            k._sqlite3_finalize = c.V;
            k._sqlite3_column_name = c.W;
            k._sqlite3_column_text = c.X;
            k._sqlite3_column_type = c.Y;
            k._sqlite3_errmsg = c.Z;
            k._sqlite3_clear_bindings = c._;
            k._sqlite3_value_blob = c.$;
            k._sqlite3_value_bytes = c.aa;
            k._sqlite3_value_double = c.ba;
            k._sqlite3_value_int = c.ca;
            k._sqlite3_value_type = c.da;
            k._sqlite3_result_blob = c.ea;
            k._sqlite3_result_double = c.fa;
            k._sqlite3_result_error = c.ga;
            k._sqlite3_result_int = c.ha;
            k._sqlite3_result_int64 = c.ia;
            k._sqlite3_result_null = c.ja;
            k._sqlite3_result_text = c.ka;
            k._sqlite3_aggregate_context = c.la;
            k._sqlite3_column_count = c.ma;
            k._sqlite3_data_count = c.na;
            k._sqlite3_column_blob = c.oa;
            k._sqlite3_column_bytes = c.pa;
            k._sqlite3_column_double = c.qa;
            k._sqlite3_bind_blob = c.ra;
            k._sqlite3_bind_double = c.sa;
            k._sqlite3_bind_int = c.ta;
            k._sqlite3_bind_text = c.ua;
            k._sqlite3_bind_parameter_index = c.va;
            k._sqlite3_sql = c.wa;
            k._sqlite3_normalized_sql = c.xa;
            k._sqlite3_changes = c.ya;
            k._sqlite3_close_v2 = c.za;
            k._sqlite3_create_function_v2 = c.Aa;
            k._sqlite3_update_hook = c.Ba;
            k._sqlite3_open = c.Ca;
            ca = k._malloc = c.Da;
            da = k._free = c.Ea;
            k._RegisterExtensionFunctions = c.Fa;
            yb = c.Ga;
            Sc = c.Ha;
            qa = c.Ia;
            y = c.Ja;
            oa = c.Ka;
            Ia = c.M;
            Z = c.O;
            Ha();
            J--;
            k.monitorRunDependencies?.(J);
            0 == J && Ua && (c = Ua, Ua = null, c());
            return Vc;
          }
          J++;
          k.monitorRunDependencies?.(J);
          var b = { a: Tc };
          if (k.instantiateWasm)
            return new Promise((c) => {
              k.instantiateWasm(b, (d, e) => {
                c(a(d, e));
              });
            });
          La ?? (La = k.locateFile ? k.locateFile("sql-wasm-browser.wasm", xa) : xa + "sql-wasm-browser.wasm");
          return a((await Oa(b)).instance);
        })();
        Uc();
        return Module;
      });
      return initSqlJsPromise;
    };
    if (typeof exports === "object" && typeof module2 === "object") {
      module2.exports = initSqlJs2;
      module2.exports.default = initSqlJs2;
    } else if (typeof define === "function" && define["amd"]) {
      define([], function() {
        return initSqlJs2;
      });
    } else if (typeof exports === "object") {
      exports["Module"] = initSqlJs2;
    }
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => EnhancedRAGPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian7 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  apiKey: "",
  apiBaseUrl: "https://api.deepseek.com/v1",
  chatModel: "deepseek-reasoner",
  mergeModel: "deepseek-chat",
  embeddingModel: "text-embedding-v4",
  embeddingBaseUrl: "",
  embeddingApiKey: "",
  embeddingDimensions: 1024,
  rerankEnabled: false,
  rerankModel: "qwen3-rerank",
  rerankBaseUrl: "",
  rerankApiKey: "",
  autoGenerateCards: true,
  enrichModel: "deepseek-chat",
  cacheSize: 100,
  historyRetentionDays: 30,
  enableQueryTypeDetection: true,
  autoOpenChatPanel: true,
  showKnowledgeUnits: true,
  theme: "auto"
};

// src/settings.ts
var import_obsidian = require("obsidian");
var RAGSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Enhanced RAG \u8BBE\u7F6E" });
    containerEl.createEl("h3", { text: "API \u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("API Key").setDesc("DeepSeek API \u5BC6\u94A5").addText((text) => text.setPlaceholder("sk-...").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
      this.plugin.settings.apiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("API Base URL").setDesc("API \u57FA\u7840\u5730\u5740").addText((text) => text.setPlaceholder("https://api.deepseek.com/v1").setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
      this.plugin.settings.apiBaseUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Chat Model").setDesc("\u7528\u4E8E\u5BF9\u8BDD\u548C\u63A8\u7406\u7684\u6A21\u578B").addText((text) => text.setPlaceholder("deepseek-reasoner").setValue(this.plugin.settings.chatModel).onChange(async (value) => {
      this.plugin.settings.chatModel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Merge Model").setDesc("\u7528\u4E8E\u5185\u5BB9\u5408\u5E76\u7684\u6A21\u578B").addText((text) => text.setPlaceholder("deepseek-chat").setValue(this.plugin.settings.mergeModel).onChange(async (value) => {
      this.plugin.settings.mergeModel = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Embedding \u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("Embedding Model").setDesc("\u5411\u91CF\u5316\u6A21\u578B\uFF08\u5982 text-embedding-v4\uFF09").addText((text) => text.setPlaceholder("text-embedding-v4").setValue(this.plugin.settings.embeddingModel).onChange(async (value) => {
      this.plugin.settings.embeddingModel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Embedding Base URL").setDesc("Embedding API \u5730\u5740\uFF08\u7559\u7A7A\u5219\u4E0E API Base URL \u76F8\u540C\uFF09").addText((text) => text.setPlaceholder("https://dashscope.aliyuncs.com/compatible-mode/v1").setValue(this.plugin.settings.embeddingBaseUrl).onChange(async (value) => {
      this.plugin.settings.embeddingBaseUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Embedding API Key").setDesc("Embedding API \u5BC6\u94A5\uFF08\u7559\u7A7A\u5219\u4F7F\u7528 Chat \u7684 API Key\uFF09").addText((text) => text.setPlaceholder("\u7559\u7A7A\u5219\u5171\u7528").setValue(this.plugin.settings.embeddingApiKey).onChange(async (value) => {
      this.plugin.settings.embeddingApiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Embedding \u7EF4\u5EA6").setDesc("\u5411\u91CF\u7EF4\u5EA6\uFF08text-embedding-v4 \u652F\u6301 64-2048\uFF09").addText((text) => text.setPlaceholder("1024").setValue(String(this.plugin.settings.embeddingDimensions)).onChange(async (value) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        this.plugin.settings.embeddingDimensions = num;
        await this.plugin.saveSettings();
      }
    }));
    containerEl.createEl("h3", { text: "Rerank \u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u542F\u7528 Rerank").setDesc("\u4F7F\u7528 Rerank \u6A21\u578B\u5BF9\u68C0\u7D22\u7ED3\u679C\u4E8C\u6B21\u6392\u5E8F").addToggle((toggle) => toggle.setValue(this.plugin.settings.rerankEnabled).onChange(async (value) => {
      this.plugin.settings.rerankEnabled = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Rerank Model").setDesc("\u6392\u5E8F\u6A21\u578B\uFF08\u5982 qwen3-rerank\u3001gte-rerank-v2\uFF09").addText((text) => text.setPlaceholder("qwen3-rerank").setValue(this.plugin.settings.rerankModel).onChange(async (value) => {
      this.plugin.settings.rerankModel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Rerank Base URL").setDesc("Rerank API \u5730\u5740\uFF08\u7559\u7A7A\u5219\u4E0E API Base URL \u76F8\u540C\uFF09").addText((text) => text.setPlaceholder("https://dashscope.aliyuncs.com/compatible-mode/v1").setValue(this.plugin.settings.rerankBaseUrl).onChange(async (value) => {
      this.plugin.settings.rerankBaseUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Rerank API Key").setDesc("Rerank API \u5BC6\u94A5\uFF08\u7559\u7A7A\u5219\u4F7F\u7528 Chat \u7684 API Key\uFF09").addText((text) => text.setPlaceholder("\u7559\u7A7A\u5219\u5171\u7528").setValue(this.plugin.settings.rerankApiKey).onChange(async (value) => {
      this.plugin.settings.rerankApiKey = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u7D22\u5F15\u5361\u8BED\u4E49\u586B\u5145" });
    new import_obsidian.Setting(containerEl).setName("\u586B\u5145\u6A21\u578B").setDesc("\u7528\u4E8E\u586B\u5145 topic_secondary / question_types / best_for / not_for / read_with \u7684\u6A21\u578B").addText((text) => text.setPlaceholder("deepseek-chat").setValue(this.plugin.settings.enrichModel).onChange(async (value) => {
      this.plugin.settings.enrichModel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("LLM \u586B\u5145\u8BED\u4E49\u5B57\u6BB5").setDesc("\u8C03\u7528 LLM \u6279\u91CF\u586B\u5145\u6240\u6709\u7D22\u5F15\u5361\u7684 5 \u4E2A\u8BED\u4E49\u5B57\u6BB5\uFF08\u9700\u8981\u5DF2\u914D\u7F6E API Key\uFF09").addButton((button) => button.setButtonText("\u5F00\u59CB\u586B\u5145").onClick(async () => {
      button.setButtonText("\u586B\u5145\u4E2D...");
      try {
        await this.plugin.enrichIndexCards();
        button.setButtonText("\u5B8C\u6210");
      } catch (e) {
        button.setButtonText("\u5931\u8D25");
      }
      setTimeout(() => button.setButtonText("\u5F00\u59CB\u586B\u5145"), 2e3);
    }));
    containerEl.createEl("h3", { text: "\u6027\u80FD\u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u7F13\u5B58\u5927\u5C0F").setDesc("LRU \u7F13\u5B58\u6700\u5927\u6761\u76EE\u6570").addText((text) => text.setPlaceholder("100").setValue(String(this.plugin.settings.cacheSize)).onChange(async (value) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        this.plugin.settings.cacheSize = num;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian.Setting(containerEl).setName("\u5386\u53F2\u4FDD\u7559\u5929\u6570").setDesc("\u5386\u53F2\u6570\u636E\u4FDD\u7559\u5929\u6570").addText((text) => text.setPlaceholder("30").setValue(String(this.plugin.settings.historyRetentionDays)).onChange(async (value) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        this.plugin.settings.historyRetentionDays = num;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian.Setting(containerEl).setName("\u542F\u7528\u67E5\u8BE2\u7C7B\u578B\u68C0\u6D4B").setDesc("\u6839\u636E\u67E5\u8BE2\u7C7B\u578B\u81EA\u52A8\u8C03\u6574\u6743\u91CD").addToggle((toggle) => toggle.setValue(this.plugin.settings.enableQueryTypeDetection).onChange(async (value) => {
      this.plugin.settings.enableQueryTypeDetection = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u751F\u6210\u7D22\u5F15\u5361").setDesc("\u6587\u4EF6\u4FDD\u5B58\u65F6\u81EA\u52A8\u751F\u6210/\u66F4\u65B0\u7D22\u5F15\u5361\u5230 00_INDEX/files/").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoGenerateCards).onChange(async (value) => {
      this.plugin.settings.autoGenerateCards = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u754C\u9762\u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u6253\u5F00\u9762\u677F").setDesc("\u641C\u7D22\u65F6\u81EA\u52A8\u6253\u5F00 RAG \u9762\u677F").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoOpenChatPanel).onChange(async (value) => {
      this.plugin.settings.autoOpenChatPanel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u663E\u793A\u77E5\u8BC6\u5355\u5143").setDesc("\u5728\u7ED3\u679C\u4E2D\u663E\u793A\u77E5\u8BC6\u5355\u5143").addToggle((toggle) => toggle.setValue(this.plugin.settings.showKnowledgeUnits).onChange(async (value) => {
      this.plugin.settings.showKnowledgeUnits = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u6570\u636E\u7BA1\u7406" });
    new import_obsidian.Setting(containerEl).setName("\u91CD\u5EFA\u7D22\u5F15").setDesc("\u91CD\u5EFA\u68C0\u7D22\u7D22\u5F15\uFF08\u6E05\u9664\u5E76\u91CD\u65B0\u6784\u5EFA\u5173\u952E\u8BCD\u548C\u5411\u91CF\u7D22\u5F15\uFF09").addButton((button) => button.setButtonText("\u91CD\u5EFA").onClick(async () => {
      await this.plugin.rebuildIndexes();
      button.setButtonText("\u5B8C\u6210");
      setTimeout(() => button.setButtonText("\u91CD\u5EFA"), 2e3);
    }));
    new import_obsidian.Setting(containerEl).setName("\u91CD\u5EFA\u7D22\u5F15\u5361").setDesc("\u626B\u63CF\u6240\u6709 Markdown \u6587\u4EF6\uFF0C\u91CD\u65B0\u751F\u6210 00_INDEX/files/ \u4E0B\u7684\u7D22\u5F15\u5361").addButton((button) => button.setButtonText("\u91CD\u5EFA").onClick(async () => {
      await this.plugin.rebuildIndexCards();
      button.setButtonText("\u5B8C\u6210");
      setTimeout(() => button.setButtonText("\u91CD\u5EFA"), 2e3);
    }));
    new import_obsidian.Setting(containerEl).setName("\u6E05\u9664\u7F13\u5B58").setDesc("\u6E05\u9664\u6240\u6709\u7F13\u5B58\u6570\u636E").addButton((button) => button.setButtonText("\u6E05\u9664").onClick(async () => {
      await this.plugin.clearCache();
      button.setButtonText("\u5DF2\u6E05\u9664");
      setTimeout(() => button.setButtonText("\u6E05\u9664"), 2e3);
    }));
    new import_obsidian.Setting(containerEl).setName("\u91CD\u7F6E\u5386\u53F2").setDesc("\u6E05\u9664\u6240\u6709\u67E5\u8BE2\u548C\u4EA4\u4E92\u5386\u53F2").addButton((button) => button.setButtonText("\u91CD\u7F6E").setWarning().onClick(async () => {
      await this.plugin.clearHistory();
      button.setButtonText("\u5DF2\u91CD\u7F6E");
      setTimeout(() => button.setButtonText("\u91CD\u7F6E"), 2e3);
    }));
  }
};

// src/utils/file-utils.ts
var import_obsidian2 = require("obsidian");
async function fileToDocument(file, vault) {
  const content = await vault.cachedRead(file);
  const lines = content.split("\n");
  let title = file.basename;
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/);
    if (match) {
      title = match[1].trim();
      break;
    }
  }
  const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    links.push(linkMatch[1].trim());
  }
  let summary = "";
  let inParagraph = false;
  for (const line of lines) {
    if (line.startsWith("#"))
      continue;
    if (line.trim() === "") {
      if (inParagraph)
        break;
      continue;
    }
    if (!inParagraph)
      inParagraph = true;
    summary += line + " ";
    if (summary.length > 200)
      break;
  }
  return {
    id: file.path,
    title,
    content,
    path: file.path,
    summary: summary.trim(),
    links: [...new Set(links)],
    lastModified: file.stat.mtime
  };
}
function getAllMarkdownFiles(vault) {
  return vault.getMarkdownFiles();
}
function parseCardFrontmatter(content) {
  const fm = {};
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match)
    return fm;
  const lines = match[1].split("\n");
  let currentKey = null;
  let currentList = [];
  for (const line of lines) {
    const listMatch = line.match(/^\s{2,}-\s+(.+)$/);
    if (listMatch && currentKey) {
      currentList.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }
    if (currentKey && currentList.length) {
      fm[currentKey] = currentList.join("\n");
      currentList = [];
      currentKey = null;
    }
    const kv = line.match(/^([\w_]+)\s*:\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim().replace(/^["']|["']$/g, "");
      if (val) {
        fm[key] = val;
      } else {
        currentKey = key;
        currentList = [];
      }
    }
  }
  if (currentKey && currentList.length) {
    fm[currentKey] = currentList.join("\n");
  }
  return fm;
}
function parseYamlList(raw) {
  if (!raw)
    return [];
  if (raw.includes("\n")) {
    return raw.split("\n").filter((l) => l.trim()).map((l) => l.trim().replace(/^["']|["']$/g, ""));
  }
  return raw.split(",").filter((x) => x.trim()).map((x) => x.trim().replace(/^["']|["']$/g, ""));
}
async function readIndexCard(file, vault) {
  try {
    const content = await vault.cachedRead(file);
    const fm = parseCardFrontmatter(content);
    if (!fm.doc_id && !fm.title)
      return null;
    return {
      docId: fm.doc_id || file.path,
      title: fm.title || file.basename,
      path: fm.path || file.path,
      scope: fm.scope || "mainline",
      tags: parseYamlList(fm.tags || ""),
      headings: parseYamlList(fm.headings || ""),
      outlinks: parseYamlList(fm.outlinks || ""),
      domain: fm.domain || "",
      topicPrimary: fm.topic_primary || "",
      topicSecondary: parseYamlList(fm.topic_secondary || ""),
      noteRole: fm.note_role || "mixed",
      questionTypes: parseYamlList(fm.question_types || ""),
      oneLineSummary: fm.one_line_summary || "",
      retrievalKeywords: parseYamlList(fm.retrieval_keywords || ""),
      bestFor: parseYamlList(fm.best_for || ""),
      notFor: parseYamlList(fm.not_for || ""),
      readWith: parseYamlList(fm.read_with || ""),
      sourceHash: fm.source_hash || "",
      buildStatus: fm.build_status || "success",
      generatedAt: fm.generated_at || "",
      content: content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").substring(0, 2e3)
    };
  } catch {
    return null;
  }
}
async function getIndexCards(vault) {
  const indexFolder = vault.getAbstractFileByPath("00_INDEX/files");
  if (!indexFolder || !(indexFolder instanceof import_obsidian2.TFolder)) {
    return [];
  }
  const cards = [];
  for (const child of indexFolder.children) {
    if (child instanceof import_obsidian2.TFile && child.extension === "md") {
      const card = await readIndexCard(child, vault);
      if (card)
        cards.push(card);
    }
  }
  return cards;
}
function tokenize(text) {
  return text.toLowerCase().replace(/[^\w一-鿿\s]/g, " ").split(/\s+/).filter((token) => token.length > 1);
}
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// src/retrieval/keyword-retriever.ts
var KeywordRetriever = class {
  constructor(vault) {
    this.invertedIndex = {};
    this.documents = /* @__PURE__ */ new Map();
    this.indexBuilt = false;
    this.vault = vault;
  }
  /**
   * Build or rebuild the inverted index
   */
  async buildIndex() {
    this.invertedIndex = {};
    this.documents.clear();
    const files = getAllMarkdownFiles(this.vault);
    for (const file of files) {
      const doc = await fileToDocument(file, this.vault);
      this.documents.set(doc.id, doc);
      const tokens = tokenize(doc.title + " " + doc.content);
      for (const token of tokens) {
        if (!this.invertedIndex[token]) {
          this.invertedIndex[token] = [];
        }
        if (!this.invertedIndex[token].includes(doc.id)) {
          this.invertedIndex[token].push(doc.id);
        }
      }
    }
    this.indexBuilt = true;
    console.log(`[RAG] Keyword index built: ${this.documents.size} documents, ${Object.keys(this.invertedIndex).length} terms`);
  }
  /**
   * Search by keywords
   */
  async search(query, options = { limit: 50 }) {
    if (!this.indexBuilt) {
      await this.buildIndex();
    }
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0)
      return [];
    const scores = /* @__PURE__ */ new Map();
    for (const token of queryTokens) {
      const docIds = this.invertedIndex[token] || [];
      const idf = Math.log((this.documents.size + 1) / (docIds.length + 1));
      for (const docId of docIds) {
        const currentScore = scores.get(docId) || 0;
        scores.set(docId, currentScore + idf);
      }
    }
    const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, options.limit);
    const maxScore = sorted.length > 0 ? sorted[0][1] : 1;
    const results = [];
    for (const [docId, score] of sorted) {
      const doc = this.documents.get(docId);
      if (!doc)
        continue;
      const snippet = this.extractSnippet(doc.content, queryTokens);
      results.push({
        docId,
        title: doc.title,
        path: doc.path,
        score: score / maxScore,
        snippet,
        source: "keyword"
      });
    }
    return results;
  }
  /**
   * Extract a snippet containing query terms
   */
  extractSnippet(content, tokens) {
    const sentences = content.split(/[。！？\n.!?]+/);
    const lowerTokens = tokens.map((t) => t.toLowerCase());
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasMatch = lowerTokens.some((token) => lowerSentence.includes(token));
      if (hasMatch && sentence.trim().length > 10) {
        return sentence.trim().substring(0, 200);
      }
    }
    return content.substring(0, 200).trim();
  }
  /**
   * Get index statistics
   */
  getStats() {
    return {
      documentCount: this.documents.size,
      termCount: Object.keys(this.invertedIndex).length,
      indexed: this.indexBuilt
    };
  }
  /**
   * Incremental update: add or update a document
   */
  async updateDocument(filePath) {
    const file = this.vault.getAbstractFileByPath(filePath);
    if (!file || !("stat" in file))
      return;
    const oldDoc = this.documents.get(filePath);
    if (oldDoc) {
      const oldTokens = tokenize(oldDoc.title + " " + oldDoc.content);
      for (const token of oldTokens) {
        if (this.invertedIndex[token]) {
          this.invertedIndex[token] = this.invertedIndex[token].filter((id) => id !== filePath);
          if (this.invertedIndex[token].length === 0) {
            delete this.invertedIndex[token];
          }
        }
      }
    }
    const doc = await fileToDocument(file, this.vault);
    this.documents.set(doc.id, doc);
    const tokens = tokenize(doc.title + " " + doc.content);
    for (const token of tokens) {
      if (!this.invertedIndex[token]) {
        this.invertedIndex[token] = [];
      }
      if (!this.invertedIndex[token].includes(doc.id)) {
        this.invertedIndex[token].push(doc.id);
      }
    }
  }
  /**
   * Remove a document from the index
   */
  removeDocument(filePath) {
    const doc = this.documents.get(filePath);
    if (!doc)
      return;
    const tokens = tokenize(doc.title + " " + doc.content);
    for (const token of tokens) {
      if (this.invertedIndex[token]) {
        this.invertedIndex[token] = this.invertedIndex[token].filter((id) => id !== filePath);
        if (this.invertedIndex[token].length === 0) {
          delete this.invertedIndex[token];
        }
      }
    }
    this.documents.delete(filePath);
  }
};

// src/retrieval/index-retriever.ts
var IndexCardStore = class {
  constructor(vault) {
    this.cardsByPath = /* @__PURE__ */ new Map();
    this.cardsById = /* @__PURE__ */ new Map();
    this.allKnownPaths = /* @__PURE__ */ new Set();
    this.loaded = false;
    this.vault = vault;
  }
  /**
   * Load all index cards and build path mappings
   */
  async loadIndex() {
    const cards = await getIndexCards(this.vault);
    this.cardsByPath.clear();
    this.cardsById.clear();
    this.allKnownPaths.clear();
    for (const card of cards) {
      const path = card.path || card.docId;
      this.cardsByPath.set(path.toLowerCase(), card);
      this.cardsById.set(card.docId, card);
      this.allKnownPaths.add(path.toLowerCase());
      const basename = path.replace(/\.md$/, "").split("/").pop()?.toLowerCase();
      if (basename) {
        this.allKnownPaths.add(basename);
      }
    }
    this.loaded = true;
    console.log(`[RAG] Index card store loaded: ${cards.length} cards`);
  }
  /**
   * Get a card by file path
   */
  getCardByPath(path) {
    if (!this.loaded)
      return void 0;
    return this.cardsByPath.get(path.toLowerCase());
  }
  /**
   * Get cards by multiple paths (on-demand reading)
   */
  getCardsByPaths(paths) {
    const result = /* @__PURE__ */ new Map();
    for (const p of paths) {
      const card = this.cardsByPath.get(p.toLowerCase());
      if (card)
        result.set(p, card);
    }
    return result;
  }
  /**
   * Get linked file paths from a card (Wiki Link expansion).
   * Validates links against known file paths.
   */
  getLinkedPaths(cardPath) {
    const card = this.cardsByPath.get(cardPath.toLowerCase());
    if (!card)
      return [];
    const linked = [];
    const allLinks = [...card.outlinks || [], ...card.readWith || []];
    for (const link of allLinks) {
      const clean = link.trim().replace(/\.md$/, "").toLowerCase();
      if (this.allKnownPaths.has(clean)) {
        linked.push(link.trim());
        continue;
      }
      const namePart = clean.split("/").pop() || clean;
      if (this.allKnownPaths.has(namePart)) {
        linked.push(link.trim());
      }
    }
    return [...new Set(linked)];
  }
  /**
   * Resolve a link name to a known file path
   */
  resolveLink(linkName) {
    const clean = linkName.trim().replace(/\.md$/, "").toLowerCase();
    if (this.cardsByPath.has(clean)) {
      return clean;
    }
    const namePart = clean.split("/").pop() || clean;
    for (const [path] of this.cardsByPath) {
      const pathBasename = path.split("/").pop()?.replace(/\.md$/, "");
      if (pathBasename === namePart) {
        return path;
      }
    }
    return null;
  }
  /**
   * Get all loaded cards
   */
  getAllCards() {
    return [...this.cardsByPath.values()];
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      cardCount: this.cardsByPath.size,
      loaded: this.loaded
    };
  }
};

// src/cloud/api.ts
var MAX_RETRIES = 3;
var RETRY_DELAY_MS = 1e3;
var CloudAPIClient = class {
  constructor(settings) {
    this.settings = settings;
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  /**
   * Call the chat completion API
   */
  async chat(request) {
    if (!this.settings.apiKey) {
      throw new Error("API key not configured. Please set it in plugin settings.");
    }
    const url = `${this.settings.apiBaseUrl}/chat/completions`;
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.settings.apiKey}`
          },
          body: JSON.stringify(request)
        });
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1e3 : RETRY_DELAY_MS * (attempt + 1);
            await this.sleep(delay);
            continue;
          }
          throw new Error(`API error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content;
        }
        throw new Error("No response choices returned");
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }
    throw lastError || new Error("API call failed after retries");
  }
  /**
   * Generate embeddings for text
   * Uses embeddingBaseUrl (fallback to apiBaseUrl), embeddingModel, and embeddingApiKey (fallback to apiKey).
   */
  async embed(text) {
    const baseUrl = (this.settings.embeddingBaseUrl || this.settings.apiBaseUrl).replace(/\/$/, "");
    const url = `${baseUrl}/embeddings`;
    const model = this.settings.embeddingModel || "text-embedding-v4";
    const embedKey = this.settings.embeddingApiKey || this.settings.apiKey;
    const headers = { "Content-Type": "application/json" };
    if (embedKey) {
      headers["Authorization"] = `Bearer ${embedKey}`;
    }
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            input: text
          })
        });
        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1e3 : RETRY_DELAY_MS * (attempt + 1);
            await this.sleep(delay);
            continue;
          }
          const errorText = await response.text();
          throw new Error(`Embedding API error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].embedding;
        }
        throw new Error("No embedding returned");
      } catch (error) {
        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY_MS * (attempt + 1));
        } else {
          throw error;
        }
      }
    }
    throw new Error("Embedding API call failed after retries");
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/utils/cache-utils.ts
var LRUCache = class {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    if (!this.cache.has(key))
      return void 0;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
  has(key) {
    return this.cache.has(key);
  }
  delete(key) {
    return this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
  get size() {
    return this.cache.size;
  }
  entries() {
    return this.cache.entries();
  }
};
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// src/retrieval/chunker.ts
function estimateTokens(text) {
  const cjk = (text.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
  const words = (text.match(/[a-zA-Z]+/g) || []).length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const remaining = text.length - cjk - letters;
  return Math.max(1, Math.floor(cjk + words * 1.3 + remaining * 0.25));
}
function stripFrontmatter(content) {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}
function splitSections(content) {
  const sections = [];
  const headingRegex = /^#{2,3}\s+.+$/gm;
  let lastPos = 0;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    if (match.index > lastPos) {
      sections.push({ text: content.slice(lastPos, match.index), pos: lastPos });
    }
    lastPos = match.index;
  }
  if (lastPos < content.length) {
    sections.push({ text: content.slice(lastPos), pos: lastPos });
  }
  if (sections.length === 0) {
    sections.push({ text: content, pos: 0 });
  }
  return sections;
}
function splitParagraphs(text) {
  const parts = text.split(/\n\s*\n/);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}
function chunkMarkdown(content, targetTokens = 420, overlapTokens = 64, maxTokens = 520) {
  const body = stripFrontmatter(content);
  if (!body.trim())
    return [];
  const sections = splitSections(body);
  const chunks = [];
  let currentText = "";
  let currentStart = sections[0]?.pos ?? 0;
  for (const { text: secText, pos: secPos } of sections) {
    const testText = currentText ? `${currentText}

${secText}`.trim() : secText;
    if (estimateTokens(testText) <= maxTokens) {
      if (currentText) {
        currentText = testText;
      } else {
        currentText = secText;
        currentStart = secPos;
      }
    } else {
      if (currentText) {
        chunks.push({
          text: currentText,
          chunkIndex: chunks.length,
          startChar: currentStart,
          endChar: currentStart + currentText.length
        });
      }
      if (estimateTokens(secText) > maxTokens) {
        const paragraphs = splitParagraphs(secText);
        let subText = "";
        let subStart = secPos;
        for (const para of paragraphs) {
          const testSub = subText ? `${subText}

${para}`.trim() : para;
          if (estimateTokens(testSub) <= maxTokens) {
            if (subText) {
              subText = testSub;
            } else {
              subText = para;
              subStart = secPos + secText.indexOf(para);
            }
          } else {
            if (subText) {
              chunks.push({
                text: subText,
                chunkIndex: chunks.length,
                startChar: subStart,
                endChar: subStart + subText.length
              });
            }
            subText = para;
            subStart = secPos + secText.indexOf(para);
          }
        }
        if (subText) {
          currentText = subText;
          currentStart = subStart;
        } else {
          currentText = "";
        }
      } else {
        currentText = secText;
        currentStart = secPos;
      }
    }
  }
  if (currentText) {
    chunks.push({
      text: currentText,
      chunkIndex: chunks.length,
      startChar: currentStart,
      endChar: currentStart + currentText.length
    });
  }
  if (overlapTokens > 0 && chunks.length > 1) {
    const overlapped = [chunks[0]];
    for (let i = 1; i < chunks.length; i++) {
      const prev = overlapped[overlapped.length - 1];
      const curr = chunks[i];
      let overlapText = "";
      for (let j = prev.text.length - 1; j >= 0; j--) {
        const candidate = prev.text.slice(j);
        if (estimateTokens(candidate) >= overlapTokens) {
          overlapText = candidate;
          break;
        }
      }
      overlapped.push({
        text: overlapText ? `${overlapText}

${curr.text}` : curr.text,
        chunkIndex: curr.chunkIndex,
        startChar: curr.startChar,
        endChar: curr.endChar
      });
    }
    return overlapped;
  }
  return chunks;
}

// src/utils/vector-store.ts
var import_sql = __toESM(require_sql_wasm_browser());
var DB_PATH = ".obsidian/plugins/obsidian-enhanced-rag/data/vectors.db";
var DATA_DIR = ".obsidian/plugins/obsidian-enhanced-rag/data";
var VectorStore = class {
  constructor(vault) {
    this.db = null;
    this._embeddings = /* @__PURE__ */ new Map();
    this._chunkInfo = /* @__PURE__ */ new Map();
    this._loaded = false;
    this._dirty = false;
    this.vault = vault;
  }
  get embeddings() {
    return this._embeddings;
  }
  get chunkInfo() {
    return this._chunkInfo;
  }
  async ensureDir() {
    try {
      await this.vault.adapter.mkdir(DATA_DIR);
    } catch {
    }
  }
  async initDB() {
    if (this.db)
      return this.db;
    const SQL = await (0, import_sql.default)();
    await this.ensureDir();
    let buffer = null;
    try {
      if (await this.vault.adapter.exists(DB_PATH)) {
        buffer = await this.vault.adapter.readBinary(DB_PATH);
      }
    } catch {
    }
    this.db = buffer ? new SQL.Database(new Uint8Array(buffer)) : new SQL.Database();
    this.db.run(`
      CREATE TABLE IF NOT EXISTS embeddings (
        chunk_id TEXT PRIMARY KEY,
        embedding BLOB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS chunk_info (
        chunk_id TEXT PRIMARY KEY,
        doc_id TEXT NOT NULL,
        title TEXT NOT NULL,
        path TEXT NOT NULL,
        scope TEXT DEFAULT 'mainline'
      );
      CREATE INDEX IF NOT EXISTS idx_chunk_info_doc ON chunk_info(doc_id);
    `);
    return this.db;
  }
  /** Load all data from database file into memory */
  async load() {
    if (this._loaded)
      return true;
    try {
      const db = await this.initDB();
      this._embeddings.clear();
      const embRows = db.exec("SELECT chunk_id, embedding FROM embeddings");
      if (embRows.length > 0) {
        const { columns, values } = embRows[0];
        const idIdx = columns.indexOf("chunk_id");
        const embIdx = columns.indexOf("embedding");
        for (const row of values) {
          const chunkId = row[idIdx];
          const blob = row[embIdx];
          const embedding = Array.from(new Float32Array(blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength)));
          this._embeddings.set(chunkId, embedding);
        }
      }
      this._chunkInfo.clear();
      const ciRows = db.exec("SELECT chunk_id, doc_id, title, path, scope FROM chunk_info");
      if (ciRows.length > 0) {
        const { columns, values } = ciRows[0];
        const idIdx = columns.indexOf("chunk_id");
        const docIdx = columns.indexOf("doc_id");
        const tIdx = columns.indexOf("title");
        const pIdx = columns.indexOf("path");
        const sIdx = columns.indexOf("scope");
        for (const row of values) {
          this._chunkInfo.set(row[idIdx], {
            docId: row[docIdx],
            title: row[tIdx],
            path: row[pIdx],
            scope: row[sIdx]
          });
        }
      }
      this._loaded = true;
      console.log(`[VectorStore] Loaded ${this._embeddings.size} embeddings, ${this._chunkInfo.size} chunk infos from SQLite`);
      return true;
    } catch (e) {
      console.warn("[VectorStore] Failed to load database:", e);
      return false;
    }
  }
  /** Persist all in-memory data to the database file */
  async save() {
    if (!this._loaded)
      return;
    try {
      const db = await this.initDB();
      db.run("BEGIN TRANSACTION");
      db.run("DELETE FROM embeddings");
      const insertEmb = db.prepare("INSERT OR REPLACE INTO embeddings (chunk_id, embedding) VALUES (?, ?)");
      for (const [chunkId, embedding] of this._embeddings) {
        const arr = new Float32Array(embedding);
        insertEmb.run([chunkId, new Uint8Array(arr.buffer)]);
      }
      insertEmb.free();
      db.run("DELETE FROM chunk_info");
      const insertCI = db.prepare("INSERT OR REPLACE INTO chunk_info (chunk_id, doc_id, title, path, scope) VALUES (?, ?, ?, ?, ?)");
      for (const [chunkId, info] of this._chunkInfo) {
        insertCI.run([chunkId, info.docId, info.title, info.path, info.scope]);
      }
      insertCI.free();
      db.run("COMMIT");
      const data = db.export();
      await this.ensureDir();
      await this.vault.adapter.writeBinary(DB_PATH, data.buffer);
      this._dirty = false;
    } catch (e) {
      console.warn("[VectorStore] Failed to save database:", e);
    }
  }
  /** Update a single embedding in-place (for batch incremental saves) */
  async saveIncremental(newEmbeddings, newInfo) {
    try {
      const db = await this.initDB();
      db.run("BEGIN TRANSACTION");
      const insertEmb = db.prepare("INSERT OR REPLACE INTO embeddings (chunk_id, embedding) VALUES (?, ?)");
      for (const { chunkId, embedding } of newEmbeddings) {
        const arr = new Float32Array(embedding);
        insertEmb.run([chunkId, new Uint8Array(arr.buffer)]);
      }
      insertEmb.free();
      const insertCI = db.prepare("INSERT OR REPLACE INTO chunk_info (chunk_id, doc_id, title, path, scope) VALUES (?, ?, ?, ?, ?)");
      for (const { chunkId, info } of newInfo) {
        insertCI.run([chunkId, info.docId, info.title, info.path, info.scope]);
      }
      insertCI.free();
      db.run("COMMIT");
      const data = db.export();
      await this.ensureDir();
      await this.vault.adapter.writeBinary(DB_PATH, data.buffer);
    } catch (e) {
      console.warn("[VectorStore] Failed to save incrementally:", e);
    }
  }
  /** Clear all persisted data */
  async clear() {
    this._embeddings.clear();
    this._chunkInfo.clear();
    try {
      if (await this.vault.adapter.exists(DB_PATH)) {
        await this.vault.adapter.remove(DB_PATH);
      }
      if (this.db) {
        this.db.run("DELETE FROM embeddings");
        this.db.run("DELETE FROM chunk_info");
      }
    } catch (e) {
      console.warn("[VectorStore] Failed to clear:", e);
    }
  }
};

// src/retrieval/vector-retriever.ts
var CHUNK_TARGET = 420;
var CHUNK_OVERLAP = 64;
var CHUNK_MAX = 520;
var VectorRetriever = class {
  constructor(vault, settings) {
    this.documents = /* @__PURE__ */ new Map();
    this.loaded = false;
    this.vault = vault;
    this.settings = settings;
    this.client = new CloudAPIClient(settings);
    this.store = new VectorStore(vault);
    this.queryCache = new LRUCache(50);
  }
  get embeddings() {
    return this.store.embeddings;
  }
  get chunkInfo() {
    return this.store.chunkInfo;
  }
  updateSettings(settings) {
    this.settings = settings;
    this.client.updateSettings(settings);
  }
  /**
   * Build vector index — restore from SQLite DB → embed only new/unknown chunks
   */
  async buildIndex() {
    if (!this.settings.apiKey) {
      console.warn("[RAG] Vector search disabled: no API key");
      this.loaded = true;
      return;
    }
    const hasData = await this.store.load();
    if (hasData) {
      console.log(`[RAG] Restored ${this.embeddings.size} chunk embeddings from vectors.db`);
    }
    this.documents.clear();
    const files = getAllMarkdownFiles(this.vault);
    for (const file of files) {
      const doc = await fileToDocument(file, this.vault);
      this.documents.set(doc.id, doc);
    }
    const persistedIds = new Set(this.embeddings.keys());
    const newJobs = [];
    let totalChunks = 0;
    for (const [docId, doc] of this.documents) {
      const chunks = chunkMarkdown(doc.content, CHUNK_TARGET, CHUNK_OVERLAP, CHUNK_MAX);
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${docId}#chunk_${i}`;
        const text = `${doc.title}
${chunks[i].text}`;
        totalChunks++;
        if (!persistedIds.has(chunkId)) {
          newJobs.push({
            chunkId,
            text,
            info: { docId, title: doc.title, path: doc.path, scope: "mainline" }
          });
        }
        if (!this.chunkInfo.has(chunkId)) {
          this.chunkInfo.set(chunkId, { docId, title: doc.title, path: doc.path, scope: "mainline" });
        }
      }
    }
    console.log(`[RAG] ${totalChunks} chunks total, ${newJobs.length} new to embed`);
    if (newJobs.length === 0) {
      this.loaded = true;
      return;
    }
    const batchSize = 5;
    for (let i = 0; i < newJobs.length; i += batchSize) {
      const batch = newJobs.slice(i, i + batchSize);
      const embedBatch = [];
      const infoBatch = [];
      const promises = batch.map(async ({ chunkId, text, info }) => {
        try {
          const embedding = await this.client.embed(text);
          this.embeddings.set(chunkId, embedding);
          this.chunkInfo.set(chunkId, info);
          embedBatch.push({ chunkId, embedding });
          infoBatch.push({ chunkId, info });
        } catch (error) {
          console.warn(`[RAG] Failed to embed chunk ${chunkId}:`, error);
        }
      });
      await Promise.all(promises);
      if (embedBatch.length > 0 || infoBatch.length > 0) {
        await this.store.saveIncremental(embedBatch, infoBatch);
      }
      if (i + batchSize < newJobs.length) {
        await this.sleep(200);
      }
    }
    this.loaded = true;
    console.log(`[RAG] Vector index built: ${this.embeddings.size} chunk embeddings persisted`);
  }
  /** Clear all persisted embeddings (force full rebuild next time) */
  async clearStore() {
    await this.store.clear();
  }
  /**
   * Search using vector similarity — chunk-level → merge to document-level
   */
  async search(query, options = { limit: 30 }) {
    if (!this.settings.apiKey || !this.loaded || this.embeddings.size === 0) {
      return [];
    }
    let queryEmbedding;
    const queryHash = hashString(query);
    const cachedQuery = this.queryCache.get(`q:${queryHash}`);
    if (cachedQuery) {
      queryEmbedding = cachedQuery;
    } else {
      try {
        queryEmbedding = await this.client.embed(query);
        this.queryCache.set(`q:${queryHash}`, queryEmbedding);
      } catch (error) {
        console.error("[RAG] Failed to embed query:", error);
        return [];
      }
    }
    const similarities = [];
    for (const [chunkId, embedding] of this.embeddings) {
      similarities.push({ chunkId, similarity: this.cosineSimilarity(queryEmbedding, embedding) });
    }
    similarities.sort((a, b) => b.similarity - a.similarity);
    const docBest = /* @__PURE__ */ new Map();
    for (const { chunkId, similarity } of similarities) {
      const info = this.chunkInfo.get(chunkId);
      if (!info)
        continue;
      const existing = docBest.get(info.docId);
      if (!existing || similarity > existing.similarity) {
        docBest.set(info.docId, { similarity, title: info.title, path: info.path, scope: info.scope });
      }
    }
    const topDocs = [...docBest.entries()].sort((a, b) => b[1].similarity - a[1].similarity).slice(0, options.limit);
    if (!topDocs.length)
      return [];
    const maxScore = topDocs[0][1].similarity;
    return topDocs.map(([docId, { similarity, title, path, scope }]) => {
      const doc = this.documents.get(docId);
      return {
        docId,
        title,
        path,
        score: similarity / maxScore,
        snippet: doc?.summary || "",
        source: "vector"
      };
    });
  }
  async searchWithExpansion(query, limit = 20, expandTopK = 3, expandNeighbors = 5) {
    const initial = await this.search(query, { limit });
    if (!initial.length || expandTopK <= 0)
      return initial;
    const seenIds = new Set(initial.map((r) => r.docId));
    const expanded = [...initial];
    for (const seed of initial.slice(0, expandTopK)) {
      const seedDoc = this.documents.get(seed.docId);
      if (!seedDoc)
        continue;
      const seedText = seedDoc.summary || seedDoc.content.substring(0, 300);
      const neighbors = await this.search(seedText, { limit: expandNeighbors + seenIds.size });
      for (const n of neighbors) {
        if (!seenIds.has(n.docId)) {
          seenIds.add(n.docId);
          n.score *= 0.7;
          expanded.push(n);
        }
      }
    }
    expanded.sort((a, b) => b.score - a.score);
    return expanded;
  }
  cosineSimilarity(a, b) {
    if (a.length !== b.length)
      return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const d = Math.sqrt(na) * Math.sqrt(nb);
    return d === 0 ? 0 : dot / d;
  }
  getStats() {
    return { documentCount: this.documents.size, embeddingCount: this.embeddings.size, loaded: this.loaded };
  }
  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
};

// src/fusion/ranker.ts
function normalizeScores(results) {
  if (results.length === 0)
    return /* @__PURE__ */ new Map();
  const maxScore = Math.max(...results.map((r) => r.score)) || 1;
  return new Map(results.map((r) => [r.docId, r.score / maxScore]));
}
function rankArticles(keywordResults, vectorResults, expansionPaths) {
  const expansionSet = new Set(expansionPaths);
  const kwScores = normalizeScores(keywordResults);
  const vecScores = normalizeScores(vectorResults);
  const allDocs = /* @__PURE__ */ new Map();
  for (const r of keywordResults)
    allDocs.set(r.docId, r);
  for (const r of vectorResults)
    allDocs.set(r.docId, r);
  const ranked = [];
  for (const [docId, doc] of allDocs) {
    const ks = kwScores.get(docId) || 0;
    const vs = vecScores.get(docId) || 0;
    const retrievalScore = ks * 0.55 + vs * 0.45;
    const crossBonus = ks > 0 && vs > 0 ? 0.15 : 0;
    const isExpanded = expansionSet.has(docId);
    const expansionBoost = isExpanded ? 0.3 : 0;
    const finalScore = retrievalScore + crossBonus + expansionBoost;
    ranked.push({
      docId,
      title: doc.title,
      path: doc.path,
      snippet: doc.snippet,
      retrievalScore,
      expansionBoost,
      cardBonus: 0,
      finalScore,
      fromExpansion: isExpanded
    });
  }
  ranked.sort((a, b) => b.finalScore - a.finalScore);
  return ranked;
}
function boostByCardFields(ranked, query, cards, queryType) {
  const queryLower = query.toLowerCase();
  const queryTokens = new Set(queryLower.split(/\s+/));
  for (const article of ranked) {
    const card = cards.get(article.docId);
    if (!card)
      continue;
    let bonus = 0;
    const keywords = card.retrievalKeywords || [];
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (queryLower.includes(kwLower) || kwLower.includes(queryLower)) {
        bonus += 0.12;
        break;
      }
      for (const t of queryTokens) {
        if (kwLower.includes(t)) {
          bonus += 0.06;
          break;
        }
      }
    }
    const topic = card.topicPrimary || "";
    if (topic && (queryLower.includes(topic.toLowerCase()) || topic.toLowerCase().includes(queryLower))) {
      bonus += 0.08;
    }
    if (queryType && card.questionTypes?.length) {
      const qtLower = card.questionTypes.map((q) => q.toLowerCase());
      if (qtLower.includes(queryType.toLowerCase())) {
        bonus += 0.1;
      }
    }
    if (card.domain) {
      bonus += 0.03;
    }
    article.cardBonus = Math.min(bonus, 0.3);
    article.finalScore += article.cardBonus;
    article.card = card;
  }
  ranked.sort((a, b) => b.finalScore - a.finalScore);
  return ranked;
}

// src/fusion/query-analyzer.ts
var QueryAnalyzer = class {
  constructor() {
    // Chinese patterns
    this.patterns = {
      definition: [
        /什么是/,
        /什么叫/,
        /定义/,
        /含义/,
        /意思/,
        /概念/,
        /是什么/,
        /怎样理解/
      ],
      procedure: [
        /怎么/,
        /如何/,
        /步骤/,
        /方法/,
        /做法/,
        /流程/,
        /过程/,
        /教程/
      ],
      comparison: [
        /区别/,
        /不同/,
        /比较/,
        /对比/,
        /差异/,
        /vs/i,
        /versus/i,
        /哪个[好坏快慢]/
      ],
      explanation: [
        /为什么/,
        /原因/,
        /解释/,
        /说明/,
        /原理/,
        /机制/
      ],
      summarization: [
        /总结/,
        /概述/,
        /概要/,
        /综述/,
        /简述/,
        /概括/
      ],
      reference: [
        /公式/,
        /数据/,
        /参数/,
        /参考/,
        /查询/,
        /值是多少/,
        /多少/
      ],
      troubleshooting: [
        /报错/,
        /出错/,
        /error/i,
        /失败/,
        /问题排查/,
        /排查/,
        /故障/,
        /bug/i
      ]
    };
  }
  /**
   * Detect query type from query text
   */
  detect(query) {
    const scores = {
      ["definition" /* DEFINITION */]: 0,
      ["procedure" /* PROCEDURE */]: 0,
      ["comparison" /* COMPARISON */]: 0,
      ["explanation" /* EXPLANATION */]: 0,
      ["summarization" /* SUMMARIZATION */]: 0
    };
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          scores[type] += 1;
        }
      }
    }
    let maxScore = 0;
    let detectedType = "explanation" /* EXPLANATION */;
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }
    return detectedType;
  }
};

// src/retrieval/manager.ts
var RetrievalManager = class {
  // Lazy-injected from main.ts
  constructor(vault, settings) {
    this.knowledgeGenerator = null;
    this.vault = vault;
    this.settings = settings;
    this.keywordRetriever = new KeywordRetriever(vault);
    this.cardStore = new IndexCardStore(vault);
    this.vectorRetriever = new VectorRetriever(vault, settings);
    this.queryAnalyzer = new QueryAnalyzer();
  }
  updateSettings(settings) {
    this.settings = settings;
    this.vectorRetriever.updateSettings(settings);
  }
  /** Inject knowledge generator (circular dependency avoidance) */
  setKnowledgeGenerator(generator) {
    this.knowledgeGenerator = generator;
  }
  /**
   * Build all indexes (keyword + cards + vector)
   */
  async buildIndexes() {
    console.log("[RAG] Building all indexes...");
    await Promise.all([
      this.keywordRetriever.buildIndex(),
      this.cardStore.loadIndex(),
      this.vectorRetriever.buildIndex()
    ]);
    console.log("[RAG] All indexes built");
  }
  /**
   * Pipeline search: query analysis → retrieval → expansion → ranking → knowledge units
   */
  async pipelineSearch(query, limit = 10) {
    const queryType = this.queryAnalyzer.detect(query);
    const [kwResults, vecResults] = await Promise.all([
      this.keywordRetriever.search(query, { limit: 50 }),
      this.settings.apiKey ? this.vectorRetriever.searchWithExpansion(query, 20, 3, 5) : Promise.resolve([])
    ]);
    const coreSet = /* @__PURE__ */ new Set();
    for (const r of kwResults.slice(0, 20))
      coreSet.add(r.docId);
    for (const r of vecResults.slice(0, 20))
      coreSet.add(r.docId);
    const corePaths = [...coreSet];
    const expansionPaths = [];
    for (const path of corePaths) {
      const linked = this.cardStore.getLinkedPaths(path);
      for (const lp of linked) {
        if (!coreSet.has(lp)) {
          expansionPaths.push(lp);
        }
      }
    }
    const allCandidatePaths = [...corePaths, ...expansionPaths];
    const cards = this.cardStore.getCardsByPaths(allCandidatePaths);
    let ranked = rankArticles(kwResults, vecResults, expansionPaths);
    ranked = boostByCardFields(ranked, query, cards, queryType);
    console.log(
      `[RAG] Pipeline: queryType=${queryType}, keyword=${kwResults.length}, vector=${vecResults.length}, expansion=${expansionPaths.length}, ranked=${ranked.length}`
    );
    return { ranked: ranked.slice(0, limit), cards };
  }
  /**
   * Update a single document in keyword index
   */
  async updateDocument(filePath) {
    await this.keywordRetriever.updateDocument(filePath);
  }
  /**
   * Remove a document from keyword index
   */
  removeDocument(filePath) {
    this.keywordRetriever.removeDocument(filePath);
  }
  /**
   * Get statistics for all retrievers
   */
  getStats() {
    return {
      keyword: this.keywordRetriever.getStats(),
      cards: this.cardStore.getStats(),
      vector: this.vectorRetriever.getStats()
    };
  }
};

// src/fusion/result-fusion.ts
var ResultFusion = class {
  /**
   * Apply history boost to ranked results
   */
  applyHistoryBoost(results, topicPreferences) {
    return results.map((result) => {
      let boost = 0;
      const titleLower = result.title.toLowerCase();
      for (const [topic, preference] of Object.entries(topicPreferences)) {
        if (titleLower.includes(topic.toLowerCase())) {
          boost += preference * 0.3;
        }
      }
      return {
        ...result,
        finalScore: result.finalScore + boost
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }
};

// src/knowledge/cluster.ts
var DocumentClusterer = class {
  constructor() {
    this.indexCards = [];
  }
  setIndexCards(cards) {
    this.indexCards = cards;
  }
  /**
   * Cluster documents by topic based on index cards and links
   */
  cluster(documents, topics) {
    const clusters = topics.map((topic) => ({
      topic,
      documents: [],
      coreDocument: null
    }));
    const assigned = /* @__PURE__ */ new Set();
    for (const doc of documents) {
      const card = this.indexCards.find(
        (c) => c.path === doc.id || c.title.toLowerCase() === doc.title.toLowerCase()
      );
      if (card && card.topicPrimary) {
        for (const cluster of clusters) {
          if (this.topicMatch(card.topicPrimary, cluster.topic)) {
            cluster.documents.push(doc);
            assigned.add(doc.id);
            break;
          }
        }
      }
    }
    for (const doc of documents) {
      if (assigned.has(doc.id))
        continue;
      let bestCluster = null;
      let bestScore = 0;
      for (const cluster of clusters) {
        const score = this.computeTopicScore(doc, cluster.topic);
        if (score > bestScore) {
          bestScore = score;
          bestCluster = cluster;
        }
      }
      if (bestCluster && bestScore > 0.1) {
        bestCluster.documents.push(doc);
      }
    }
    for (const cluster of clusters) {
      cluster.coreDocument = this.findCoreDocument(cluster.documents);
    }
    return clusters.filter((c) => c.documents.length > 0);
  }
  /**
   * Check if two topics match
   */
  topicMatch(topic1, topic2) {
    const t1 = topic1.toLowerCase();
    const t2 = topic2.toLowerCase();
    return t1.includes(t2) || t2.includes(t1);
  }
  /**
   * Compute topic relevance score for a document
   */
  computeTopicScore(doc, topic) {
    let score = 0;
    const topicLower = topic.toLowerCase();
    const topicWords = topicLower.split(/\s+/);
    const titleLower = doc.title.toLowerCase();
    if (titleLower.includes(topicLower))
      score += 3;
    for (const word of topicWords) {
      if (titleLower.includes(word))
        score += 1;
    }
    if (doc.summary) {
      const summaryLower = doc.summary.toLowerCase();
      if (summaryLower.includes(topicLower))
        score += 2;
      for (const word of topicWords) {
        if (summaryLower.includes(word))
          score += 0.5;
      }
    }
    return score;
  }
  /**
   * Find the core document in a cluster (most referenced)
   */
  findCoreDocument(documents) {
    if (documents.length === 0)
      return null;
    if (documents.length === 1)
      return documents[0];
    const linkCounts = /* @__PURE__ */ new Map();
    for (const doc of documents) {
      if (doc.links) {
        for (const link of doc.links) {
          const linkedDoc = documents.find(
            (d) => d.title.toLowerCase() === link.toLowerCase()
          );
          if (linkedDoc) {
            linkCounts.set(linkedDoc.id, (linkCounts.get(linkedDoc.id) || 0) + 1);
          }
        }
      }
    }
    let maxLinks = 0;
    let coreDoc = documents[0];
    for (const [docId, count] of linkCounts) {
      if (count > maxLinks) {
        maxLinks = count;
        const doc = documents.find((d) => d.id === docId);
        if (doc)
          coreDoc = doc;
      }
    }
    return coreDoc;
  }
};

// src/knowledge/merger.ts
var ContentMerger = class {
  constructor(batchProcessor) {
    this.batchProcessor = batchProcessor;
  }
  /**
   * Merge documents in clusters into knowledge units
   */
  async merge(clusters, query) {
    if (clusters.length === 0)
      return [];
    const units = await this.batchProcessor.generateKnowledgeUnits(clusters, query);
    for (let i = 0; i < units.length && i < clusters.length; i++) {
      const unit = units[i];
      const cluster = clusters[i];
      unit.sourceCount = cluster.documents.length;
      unit.sourceDocuments = cluster.documents.map((d) => d.id);
      unit.relevanceScore = 1 - i * 0.1;
    }
    return units;
  }
  /**
   * Simple local merge (fallback when API is not available)
   */
  mergeLocally(clusters, query) {
    return clusters.map((cluster, index) => {
      const allContent = cluster.documents.map((d) => d.summary || d.content.substring(0, 200)).join(" ");
      const sentences = allContent.split(/[。！？\n.!?]+/).filter((s) => s.trim().length > 10).slice(0, 5);
      return {
        id: `ku-local-${Date.now()}-${index}`,
        topic: cluster.topic,
        summary: sentences.join("\u3002") + "\u3002",
        keyPoints: sentences.slice(0, 3).map((s) => s.trim()),
        sourceCount: cluster.documents.length,
        relevanceScore: 1 - index * 0.1,
        historyBoost: 0,
        suggestedUsage: `\u57FA\u4E8E ${cluster.documents.length} \u7BC7\u6587\u6863\u7684\u7EFC\u5408\u4FE1\u606F`,
        sourceDocuments: cluster.documents.map((d) => d.id)
      };
    });
  }
};

// src/cloud/cache.ts
var CloudCache = class {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new LRUCache(maxSize);
  }
  /**
   * Get cached response for a query
   */
  get(query, model) {
    const key = this.generateKey(query, model);
    const entry = this.cache.get(key);
    if (!entry)
      return null;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1e3;
    if (Date.now() - entry.timestamp > thirtyDaysMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.response;
  }
  /**
   * Store a response in cache
   */
  set(query, model, response) {
    const key = this.generateKey(query, model);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      queryHash: key
    });
  }
  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
  generateKey(query, model) {
    return `${model}:${hashString(query)}`;
  }
};

// src/cloud/batch-processor.ts
var BatchProcessor = class {
  constructor(settings) {
    this.settings = settings;
    this.client = new CloudAPIClient(settings);
    this.cache = new CloudCache(settings.cacheSize);
  }
  updateSettings(settings) {
    this.settings = settings;
    this.client.updateSettings(settings);
  }
  /**
   * Generate knowledge units from document clusters in a single API call
   */
  async generateKnowledgeUnits(clusters, query) {
    if (clusters.length === 0)
      return [];
    const cacheKey = this.buildCacheKey(clusters, query);
    const cached = this.cache.get(cacheKey, this.settings.mergeModel);
    if (cached) {
      try {
        return this.parseKnowledgeUnits(JSON.parse(cached));
      } catch {
      }
    }
    const prompt = this.buildBatchPrompt(clusters, query);
    const response = await this.client.chat({
      model: this.settings.mergeModel,
      messages: [
        {
          role: "system",
          content: "\u4F60\u662F\u4E00\u4E2A\u77E5\u8BC6\u6574\u7406\u4E13\u5BB6\u3002\u8BF7\u6839\u636E\u63D0\u4F9B\u7684\u6587\u6863\u7C07\uFF0C\u4E3A\u6BCF\u4E2A\u4E3B\u9898\u751F\u6210\u4E00\u4E2A\u77E5\u8BC6\u5355\u5143\u3002\u8F93\u51FA\u5FC5\u987B\u662F\u6709\u6548\u7684JSON\u6570\u7EC4\u683C\u5F0F\u3002"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 8e3,
      temperature: 0.2
    });
    this.cache.set(cacheKey, this.settings.mergeModel, response);
    const parsed = this.parseResponse(response);
    return this.parseKnowledgeUnits(parsed);
  }
  /**
   * Identify topics from documents
   */
  async identifyTopics(documents, query) {
    const topicsFromDocs = /* @__PURE__ */ new Set();
    for (const doc of documents) {
      if (doc.topics) {
        doc.topics.forEach((t) => topicsFromDocs.add(t));
      }
    }
    if (topicsFromDocs.size >= 3) {
      return [...topicsFromDocs].slice(0, 8);
    }
    const cacheKey = `topics:${query}:${documents.map((d) => d.id).join(",")}`;
    const cached = this.cache.get(cacheKey, this.settings.mergeModel);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
      }
    }
    const docSummaries = documents.map((d) => `- ${d.title}: ${d.summary || d.content.substring(0, 100)}`).join("\n");
    const response = await this.client.chat({
      model: this.settings.mergeModel,
      messages: [
        {
          role: "system",
          content: '\u5206\u6790\u6587\u6863\u96C6\u5408\uFF0C\u63D0\u53D63-8\u4E2A\u4E3B\u8981\u4E3B\u9898\u3002\u4EE5JSON\u6570\u7EC4\u683C\u5F0F\u8FD4\u56DE\uFF0C\u5982 ["\u4E3B\u98981", "\u4E3B\u98982"]'
        },
        {
          role: "user",
          content: `\u67E5\u8BE2\uFF1A${query}

\u6587\u6863\uFF1A
${docSummaries}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });
    this.cache.set(cacheKey, this.settings.mergeModel, response);
    try {
      const topics = JSON.parse(response);
      if (Array.isArray(topics)) {
        return topics.slice(0, 8);
      }
    } catch {
    }
    return [...topicsFromDocs];
  }
  /**
   * Build a batch prompt for knowledge unit generation
   */
  buildBatchPrompt(clusters, query) {
    let prompt = `\u8BF7\u6839\u636E\u4EE5\u4E0B\u6587\u6863\u7C07\uFF0C\u4E3A\u6BCF\u4E2A\u4E3B\u9898\u751F\u6210\u4E00\u4E2A\u77E5\u8BC6\u5355\u5143\u3002

## \u67E5\u8BE2\uFF1A${query}

## \u6587\u6863\u7C07\u4FE1\u606F\uFF1A
`;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      prompt += `### \u4E3B\u9898 ${i + 1}\uFF1A${cluster.topic}
`;
      prompt += `\u6587\u6863\u6570\u91CF\uFF1A${cluster.documents.length}
`;
      prompt += `\u6587\u6863\u5217\u8868\uFF1A
`;
      for (const doc of cluster.documents) {
        const summary = doc.summary || doc.content.substring(0, 150);
        prompt += `- ${doc.title}: ${summary}
`;
      }
      prompt += "\n";
    }
    prompt += `## \u751F\u6210\u8981\u6C42\uFF1A
1. \u6BCF\u4E2A\u77E5\u8BC6\u5355\u5143\u5305\u542B\uFF1A\u4E3B\u9898\u540D\u79F0\u3001\u5408\u5E76\u6458\u8981\uFF08300-500\u5B57\uFF09\u30013-5\u4E2A\u5173\u952E\u70B9\u3001\u5EFA\u8BAE\u4F7F\u7528\u573A\u666F
2. \u6D88\u9664\u91CD\u590D\u5185\u5BB9\uFF0C\u4FDD\u7559\u6700\u51C6\u786E\u7248\u672C
3. \u8865\u5145\u7F3A\u5931\u7684\u903B\u8F91\u73AF\u8282

## \u8F93\u51FA\u683C\u5F0F\uFF1A
\u8BF7\u4EE5JSON\u6570\u7EC4\u683C\u5F0F\u8F93\u51FA\uFF1A
[
  {
    "topic": "\u4E3B\u9898\u540D\u79F0",
    "summary": "\u5408\u5E76\u6458\u8981",
    "keyPoints": ["\u5173\u952E\u70B91", "\u5173\u952E\u70B92"],
    "suggestedUsage": "\u5EFA\u8BAE\u4F7F\u7528\u573A\u666F"
  }
]`;
    return prompt;
  }
  /**
   * Parse response JSON from AI
   */
  parseResponse(response) {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed))
          return parsed;
      } catch {
      }
    }
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed))
        return parsed;
    } catch {
    }
    return [];
  }
  /**
   * Convert parsed response to KnowledgeUnit objects
   */
  parseKnowledgeUnits(data) {
    return data.map((item, index) => {
      const obj = item;
      return {
        id: `ku-${Date.now()}-${index}`,
        topic: obj.topic || `\u4E3B\u9898 ${index + 1}`,
        summary: obj.summary || "",
        keyPoints: Array.isArray(obj.keyPoints) ? obj.keyPoints : [],
        sourceCount: 0,
        relevanceScore: 1 - index * 0.1,
        historyBoost: 0,
        suggestedUsage: obj.suggestedUsage || "",
        sourceDocuments: []
      };
    });
  }
  /**
   * Build a cache key from clusters and query
   */
  buildCacheKey(clusters, query) {
    const clusterIds = clusters.map((c) => c.documents.map((d) => d.id).sort().join(",")).sort().join("|");
    return `${query}::${clusterIds}`;
  }
};

// src/knowledge/generator.ts
var KnowledgeGenerator = class {
  constructor(vault, settings) {
    this.vault = vault;
    this.settings = settings;
    this.batchProcessor = new BatchProcessor(settings);
    this.clusterer = new DocumentClusterer();
    this.merger = new ContentMerger(this.batchProcessor);
  }
  updateSettings(settings) {
    this.settings = settings;
    this.batchProcessor.updateSettings(settings);
  }
  /**
   * Generate knowledge units from fused results
   */
  async generate(fusedResults, query, history = null) {
    if (fusedResults.length === 0)
      return [];
    const topResults = fusedResults.slice(0, 20);
    const documents = [];
    for (const result of topResults) {
      const file = this.vault.getAbstractFileByPath(result.path);
      if (file && "stat" in file) {
        const doc = await fileToDocument(file, this.vault);
        doc.topics = this.extractTopicsFromResult(result);
        documents.push(doc);
      }
    }
    const indexCards = await getIndexCards(this.vault);
    this.clusterer.setIndexCards(indexCards);
    let topics;
    try {
      if (this.settings.apiKey) {
        topics = await this.batchProcessor.identifyTopics(documents, query);
      } else {
        topics = this.extractTopicsLocally(documents);
      }
    } catch (error) {
      console.error("[RAG] Topic identification failed, using local fallback:", error);
      topics = this.extractTopicsLocally(documents);
    }
    if (topics.length === 0) {
      topics = [query];
    }
    const clusters = this.clusterer.cluster(documents, topics);
    let units;
    try {
      if (this.settings.apiKey) {
        units = await this.merger.merge(clusters, query);
      } else {
        units = this.merger.mergeLocally(clusters, query);
      }
    } catch (error) {
      console.error("[RAG] Knowledge unit generation failed, using local fallback:", error);
      units = this.merger.mergeLocally(clusters, query);
    }
    if (history) {
      units = this.applyHistoryBoost(units, history.topicPreferences);
    }
    return units;
  }
  /**
   * Extract topics from search result metadata
   */
  extractTopicsFromResult(result) {
    const topics = [];
    const titleWords = result.title.split(/[\s\-_]+/).filter((w) => w.length > 1);
    topics.push(...titleWords);
    return topics;
  }
  /**
   * Local topic extraction (without API)
   */
  extractTopicsLocally(documents) {
    const topicFreq = /* @__PURE__ */ new Map();
    for (const doc of documents) {
      const words = doc.title.split(/[\s\-_]+/).filter((w) => w.length > 1);
      for (const word of words) {
        topicFreq.set(word, (topicFreq.get(word) || 0) + 1);
      }
      if (doc.topics) {
        for (const topic of doc.topics) {
          topicFreq.set(topic, (topicFreq.get(topic) || 0) + 2);
        }
      }
    }
    return [...topicFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([topic]) => topic);
  }
  /**
   * Apply history-based boost to knowledge units
   */
  applyHistoryBoost(units, topicPreferences) {
    return units.map((unit) => {
      let boost = 0;
      const topicLower = unit.topic.toLowerCase();
      for (const [topic, preference] of Object.entries(topicPreferences)) {
        if (topicLower.includes(topic.toLowerCase())) {
          boost += preference * 0.15;
        }
      }
      return {
        ...unit,
        historyBoost: Math.min(boost, 0.3)
      };
    }).sort((a, b) => {
      const scoreA = a.relevanceScore + a.historyBoost;
      const scoreB = b.relevanceScore + b.historyBoost;
      return scoreB - scoreA;
    });
  }
};

// src/history/storage.ts
var DATA_VERSION = 1;
var DEFAULT_HISTORY = {
  queries: [],
  documentInteractions: [],
  topicPreferences: {},
  mergeCache: {}
};
var HistoryStorage = class {
  constructor(app, pluginDir) {
    this.app = app;
    this.pluginDir = pluginDir;
  }
  /**
   * Load history from disk
   */
  async load() {
    try {
      const adapter = this.app.vault.adapter;
      const dataPath = `${this.pluginDir}/data.json`;
      if (await adapter.exists(dataPath)) {
        const raw = await adapter.read(dataPath);
        const data = JSON.parse(raw);
        if (data.version !== DATA_VERSION) {
          return this.migrate(data);
        }
        return {
          queries: data.queries || [],
          documentInteractions: data.documentInteractions || [],
          topicPreferences: data.topicPreferences || {},
          mergeCache: data.mergeCache || {}
        };
      }
    } catch (error) {
      console.error("[RAG] Failed to load history:", error);
    }
    return { ...DEFAULT_HISTORY };
  }
  /**
   * Save history to disk
   */
  async save(history) {
    try {
      const adapter = this.app.vault.adapter;
      if (!await adapter.exists(this.pluginDir)) {
        await adapter.mkdir(this.pluginDir);
      }
      const data = {
        version: DATA_VERSION,
        ...history
      };
      await adapter.write(
        `${this.pluginDir}/data.json`,
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error("[RAG] Failed to save history:", error);
      throw error;
    }
  }
  /**
   * Clean up old data based on retention policy
   */
  cleanup(history, retentionDays) {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1e3;
    const cleanQueries = history.queries.filter((q) => q.timestamp > cutoff).slice(-100);
    const cleanInteractions = history.documentInteractions.filter((i) => i.timestamp > cutoff).slice(-500);
    const cleanMergeCache = {};
    let cacheCount = 0;
    const entries = Object.entries(history.mergeCache).sort((a, b) => b[1].timestamp - a[1].timestamp);
    for (const [key, entry] of entries) {
      if (cacheCount >= 100)
        break;
      if (entry.timestamp > cutoff) {
        cleanMergeCache[key] = entry;
        cacheCount++;
      }
    }
    return {
      queries: cleanQueries,
      documentInteractions: cleanInteractions,
      topicPreferences: history.topicPreferences,
      mergeCache: cleanMergeCache
    };
  }
  /**
   * Export history as JSON
   */
  async export(history) {
    return JSON.stringify({
      version: DATA_VERSION,
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      ...history
    }, null, 2);
  }
  /**
   * Import history from JSON
   */
  async import(jsonString) {
    const data = JSON.parse(jsonString);
    return {
      queries: data.queries || [],
      documentInteractions: data.documentInteractions || [],
      topicPreferences: data.topicPreferences || {},
      mergeCache: data.mergeCache || {}
    };
  }
  /**
   * Migrate old data format
   */
  migrate(data) {
    console.log("[RAG] Migrating history data...");
    return { ...DEFAULT_HISTORY };
  }
};

// src/history/analyzer.ts
var HistoryAnalyzer = class {
  /**
   * Calculate topic preferences from query and interaction history
   */
  calculateTopicPreferences(history) {
    const topicScores = {};
    for (const query of history.queries) {
      const words = this.extractKeywords(query.text);
      for (const word of words) {
        topicScores[word] = (topicScores[word] || 0) + 1;
      }
    }
    for (const interaction of history.documentInteractions) {
      const words = this.extractKeywords(interaction.docId);
      const weight = interaction.action === "save" ? 3 : interaction.action === "copy" ? 2 : 1;
      for (const word of words) {
        topicScores[word] = (topicScores[word] || 0) + weight;
      }
    }
    const maxScore = Math.max(...Object.values(topicScores), 1);
    const normalized = {};
    for (const [topic, score] of Object.entries(topicScores)) {
      if (score >= 2) {
        normalized[topic] = score / maxScore;
      }
    }
    return normalized;
  }
  /**
   * Find related queries from history
   */
  findRelatedQueries(history, query, limit = 5) {
    const queryKeywords = this.extractKeywords(query);
    const scored = history.queries.map((record) => {
      const recordKeywords = this.extractKeywords(record.text);
      const overlap = queryKeywords.filter((k) => recordKeywords.includes(k)).length;
      const recency = 1 / (1 + (Date.now() - record.timestamp) / (24 * 60 * 60 * 1e3));
      return { record, score: overlap * recency };
    });
    return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.record);
  }
  /**
   * Get frequently used documents
   */
  getFrequentDocuments(history, limit = 10) {
    const counts = {};
    for (const interaction of history.documentInteractions) {
      counts[interaction.docId] = (counts[interaction.docId] || 0) + 1;
    }
    return Object.entries(counts).map(([docId, count]) => ({ docId, count })).sort((a, b) => b.count - a.count).slice(0, limit);
  }
  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    return text.toLowerCase().replace(/[^\w\u4e00-\u9fff\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  }
};

// src/history/manager.ts
var HistoryManager = class {
  constructor(app, pluginDir, retentionDays = 30) {
    this.app = app;
    this.pluginDir = pluginDir;
    this.retentionDays = retentionDays;
    this.storage = new HistoryStorage(app, pluginDir);
    this.analyzer = new HistoryAnalyzer();
    this.history = {
      queries: [],
      documentInteractions: [],
      topicPreferences: {},
      mergeCache: {}
    };
  }
  /**
   * Initialize and load history
   */
  async init() {
    this.history = await this.storage.load();
    this.history = this.storage.cleanup(this.history, this.retentionDays);
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);
    console.log(`[RAG] History loaded: ${this.history.queries.length} queries, ${this.history.documentInteractions.length} interactions`);
  }
  /**
   * Record a search query
   */
  async recordQuery(text, knowledgeUnits) {
    const record = {
      id: generateId(),
      text,
      timestamp: Date.now(),
      retrievedCount: knowledgeUnits.length,
      usedKnowledgeUnits: knowledgeUnits.map((u) => u.id)
    };
    this.history.queries.push(record);
    if (this.history.queries.length > 100) {
      this.history.queries = this.history.queries.slice(-100);
    }
    await this.save();
  }
  /**
   * Record a document interaction
   */
  async recordInteraction(docId, action, queryId) {
    const interaction = {
      docId,
      timestamp: Date.now(),
      action,
      queryId
    };
    this.history.documentInteractions.push(interaction);
    if (this.history.documentInteractions.length > 500) {
      this.history.documentInteractions = this.history.documentInteractions.slice(-500);
    }
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);
    await this.save();
  }
  /**
   * Get current history
   */
  getHistory() {
    return this.history;
  }
  /**
   * Get topic preferences
   */
  getTopicPreferences() {
    return this.history.topicPreferences;
  }
  /**
   * Get recent queries
   */
  getRecentQueries(limit = 20) {
    return this.history.queries.slice(-limit).reverse();
  }
  /**
   * Find related queries
   */
  findRelatedQueries(query, limit = 5) {
    return this.analyzer.findRelatedQueries(this.history, query, limit);
  }
  /**
   * Get merge cache entry
   */
  getMergeCache(key) {
    const entry = this.history.mergeCache[key];
    if (!entry)
      return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      delete this.history.mergeCache[key];
      return null;
    }
    return entry.synthesizedContent;
  }
  /**
   * Set merge cache entry
   */
  async setMergeCache(key, topic, content, sourceHashes) {
    this.history.mergeCache[key] = {
      topic,
      synthesizedContent: content,
      timestamp: Date.now(),
      sourceHashes,
      ttl: this.retentionDays * 24 * 60 * 60 * 1e3
    };
    const keys = Object.keys(this.history.mergeCache);
    if (keys.length > 100) {
      const sorted = keys.sort(
        (a, b) => this.history.mergeCache[a].timestamp - this.history.mergeCache[b].timestamp
      );
      for (const key2 of sorted.slice(0, keys.length - 100)) {
        delete this.history.mergeCache[key2];
      }
    }
    await this.save();
  }
  /**
   * Clear all history
   */
  async clearHistory() {
    this.history = {
      queries: [],
      documentInteractions: [],
      topicPreferences: {},
      mergeCache: {}
    };
    await this.save();
  }
  /**
   * Export history data
   */
  async exportData() {
    return this.storage.export(this.history);
  }
  /**
   * Import history data
   */
  async importData(json) {
    this.history = await this.storage.import(json);
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);
    await this.save();
  }
  /**
   * Save history to disk
   */
  async save() {
    try {
      await this.storage.save(this.history);
    } catch (error) {
      console.error("[RAG] Failed to save history:", error);
    }
  }
};

// src/retrieval/card-generator.ts
var import_obsidian3 = require("obsidian");
var INDEX_DIR = "00_INDEX/files";
async function sha1(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
var ENRICH_SYSTEM_PROMPT = `\u4F60\u662F\u77E5\u8BC6\u5E93\u7D22\u5F15\u4E13\u5BB6\u3002\u4F60\u4F1A\u6536\u5230\u4E00\u6279\u6587\u6863\u5361\u7247\uFF08JSON \u6570\u7EC4\uFF09\uFF0C\u4E3A\u6BCF\u4E00\u5F20\u5361\u7247\u8865\u5145\u8BED\u4E49\u5B57\u6BB5\u3002

\u5BF9\u6BCF\u5F20\u5361\u7247\u8F93\u51FA 5 \u4E2A\u5B57\u6BB5\uFF1A
- topic_secondary: \u6D89\u53CA\u4F46\u975E\u6838\u5FC3\u7684\u5176\u4ED6\u4E3B\u9898\uFF0C0-3 \u4E2A
- question_types: \u9002\u7528\u95EE\u9898\u7C7B\u578B 1-4 \u4E2A\uFF0C\u4ECE\u679A\u4E3E\u9009\uFF1Adefinition(\u5B9A\u4E49)/explanation(\u539F\u7406\u89E3\u91CA)/comparison(\u5BF9\u6BD4)/procedure(\u6B65\u9AA4\u6D41\u7A0B)/reference(\u516C\u5F0F\u6570\u636E\u53C2\u8003)/troubleshooting(\u95EE\u9898\u6392\u67E5)
- best_for: \u4EC0\u4E48\u573A\u666F\u4F18\u5148\u63A8\u8350\u8FD9\u7BC7\uFF0C1-3 \u4E2A\uFF08\u5982"\u5165\u95E8\u5B66\u4E60"\u3001"\u516C\u5F0F\u901F\u67E5"\u3001"\u8003\u524D\u590D\u4E60"\uFF09
- not_for: \u4EC0\u4E48\u573A\u666F\u4E0D\u63A8\u8350\u8FD9\u7BC7\uFF0C0-2 \u4E2A\uFF08\u5982"\u52A8\u624B\u5B9E\u9A8C"\u3001"\u6700\u65B0\u8FDB\u5C55"\uFF09
- read_with: \u5EFA\u8BAE\u4E00\u8D77\u9605\u8BFB\u7684\u6587\u4EF6\u540D\uFF0C0-3 \u4E2A\uFF08\u53EA\u5199\u6587\u4EF6\u540D\u4E0D\u542B\u8DEF\u5F84\u548C.md\u540E\u7F00\uFF09

\u5FC5\u987B\u4EE5 JSON \u6570\u7EC4\u683C\u5F0F\u8FD4\u56DE\uFF0C\u6BCF\u4E2A\u5143\u7D20\u5BF9\u5E94\u4E00\u5F20\u8F93\u5165\u5361\u7247\u7684\u8BED\u4E49\u5B57\u6BB5\u3002\u4E0D\u8981 Markdown \u4EE3\u7801\u5757\u5305\u88F9\uFF0C\u76F4\u63A5\u8F93\u51FA\u7EAF JSON \u6570\u7EC4\uFF1A

[{"topic_secondary":["\u6B21\u4E3B\u9898"],"question_types":["definition"],"best_for":["\u5165\u95E8\u5B66\u4E60"],"not_for":[],"read_with":["\u80FD\u5E26\u7406\u8BBA"]}]`;
var CardGenerator = class {
  constructor(vault) {
    this.vault = vault;
  }
  /**
   * Generate an index card for a single file (with hash check)
   */
  async generateCard(file, force = false) {
    const content = await this.vault.cachedRead(file);
    const newHash = await sha1(content);
    if (!force) {
      const cardPath2 = `${INDEX_DIR}/${file.basename}.md`;
      const existing2 = this.vault.getAbstractFileByPath(cardPath2);
      if (existing2 instanceof import_obsidian3.TFile) {
        const cardContent2 = await this.vault.cachedRead(existing2);
        const storedHash = this.extractHashFromFrontmatter(cardContent2);
        if (storedHash === newHash)
          return false;
      }
    }
    const fm = this.parseFrontmatter(content);
    const body = this.stripFrontmatter(content);
    const title = this.extractTitle(body, file.basename);
    const rawLinks = this.extractWikiLinks(content);
    const validLinks = await this.validateLinks(rawLinks);
    const tags = this.extractTags(content, fm);
    const headings = this.extractHeadings(body);
    const domain = this.extractDomain(file.path);
    const oneLine = this.extractOneLineSummary(body);
    const keywords = this.extractKeywords(content, title);
    const noteRole = this.inferNoteRole(content);
    const cardContent = this.buildCardFile({
      docId: file.path,
      title,
      path: file.path,
      scope: "mainline",
      domain,
      topicPrimary: title,
      oneLineSummary: oneLine,
      tags,
      headings,
      retrievalKeywords: keywords,
      outlinks: validLinks,
      noteRole,
      sourceHash: newHash
    });
    const cardPath = `${INDEX_DIR}/${file.basename}.md`;
    const dir = this.vault.getAbstractFileByPath(INDEX_DIR);
    if (!dir) {
      await this.vault.createFolder(INDEX_DIR);
    }
    const existing = this.vault.getAbstractFileByPath(cardPath);
    if (existing instanceof import_obsidian3.TFile) {
      await this.vault.modify(existing, cardContent);
    } else {
      await this.vault.create(cardPath, cardContent);
    }
    return true;
  }
  /**
   * Generate cards for all markdown files in the vault
   */
  async generateAll(force = false) {
    const files = this.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (file.path.startsWith(INDEX_DIR))
        continue;
      try {
        const changed = await this.generateCard(file, force);
        if (changed)
          count++;
      } catch (e) {
        console.warn(`[RAG] Failed to generate card for ${file.path}:`, e);
      }
    }
    return count;
  }
  /**
   * Delete the index card for a file
   */
  async deleteCard(fileName) {
    const cardPath = `${INDEX_DIR}/${fileName}.md`;
    const file = this.vault.getAbstractFileByPath(cardPath);
    if (file instanceof import_obsidian3.TFile) {
      await this.vault.delete(file);
    }
  }
  /**
   * Rename the index card when a file is renamed
   */
  async renameCard(oldName, newFile) {
    await this.deleteCard(oldName);
    await this.generateCard(newFile, true);
  }
  // ── LLM semantic enrichment ──────────────────────────────
  /**
   * Call LLM to fill topic_secondary, question_types, best_for, not_for, read_with
   * Reads all card files from 00_INDEX/files/, sends metadata to LLM, writes back updated cards.
   */
  async enrichCards(apiKey, apiBaseUrl, model, onProgress) {
    if (!apiKey) {
      console.warn("[RAG] No API key configured, skipping card enrichment");
      return 0;
    }
    const cardFiles = this.getCardFiles();
    if (cardFiles.length === 0)
      return 0;
    const total = cardFiles.length;
    const baseUrl = apiBaseUrl.replace(/\/$/, "");
    const batchSize = 5;
    let count = 0;
    onProgress?.(0, total, "\u5F00\u59CB\u8BFB\u53D6\u7D22\u5F15\u5361...");
    for (let i = 0; i < cardFiles.length; i += batchSize) {
      const batch = cardFiles.slice(i, i + batchSize);
      onProgress?.(i, total, `\u6B63\u5728\u8BFB\u53D6\u5361\u7247 (${i + 1}-${Math.min(i + batchSize, total)}/${total})`);
      try {
        const cardsData = [];
        for (const file of batch) {
          const content = await this.vault.cachedRead(file);
          const fm = this.parseFrontmatter(content);
          const body = this.stripFrontmatter(content);
          cardsData.push({
            index: cardsData.length + 1,
            title: fm.title || file.basename,
            domain: fm.domain || "",
            note_role: fm.note_role || "mixed",
            headings: this.extractHeadings(body).slice(0, 10),
            one_line_summary: fm.one_line_summary || "",
            retrieval_keywords: this.parseYamlList(fm.retrieval_keywords).slice(0, 5),
            tags: this.parseYamlList(fm.tags).slice(0, 5)
          });
        }
        onProgress?.(i, total, `\u6B63\u5728\u8C03\u7528 LLM (${i + 1}-${Math.min(i + batchSize, total)}/${total})`);
        const userMsg = cardsData.map((d) => JSON.stringify(d)).join("\n");
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: ENRICH_SYSTEM_PROMPT },
              { role: "user", content: userMsg }
            ],
            max_tokens: 2e3,
            temperature: 0.1
          })
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.warn(`[RAG] Enrich batch failed: HTTP ${resp.status} \u2014 ${errText.substring(0, 200)}`);
          continue;
        }
        const data = await resp.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent)
          continue;
        let jsonStr = rawContent.trim();
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim();
        }
        let results;
        try {
          results = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.warn(`[RAG] Enrich JSON parse failed, raw: ${jsonStr.substring(0, 300)}`);
          continue;
        }
        const items = Array.isArray(results) ? results : [results];
        for (let j = 0; j < items.length && j < batch.length; j++) {
          const item = items[j];
          const file = batch[j];
          const cardContent = await this.vault.cachedRead(file);
          const fm = this.parseFrontmatter(cardContent);
          const body = this.stripFrontmatter(cardContent);
          const title = this.extractTitle(body, file.basename);
          const readWith = item.read_with || [];
          const validatedReadWith = await this.validateLinks(readWith);
          const newCard = this.buildCardFile({
            docId: fm.doc_id || file.path,
            title,
            path: fm.path || file.path,
            scope: fm.scope || "mainline",
            domain: fm.domain || "",
            topicPrimary: fm.topic_primary || title,
            oneLineSummary: fm.one_line_summary || "",
            tags: this.parseYamlList(fm.tags),
            headings: this.extractHeadings(body),
            retrievalKeywords: this.parseYamlList(fm.retrieval_keywords),
            outlinks: this.parseYamlList(fm.outlinks),
            noteRole: fm.note_role || "mixed",
            sourceHash: fm.source_hash || ""
          }, {
            topicSecondary: item.topic_secondary || [],
            questionTypes: item.question_types || [],
            bestFor: item.best_for || [],
            notFor: item.not_for || [],
            readWith: validatedReadWith
          });
          await this.vault.modify(file, newCard);
          count++;
        }
        onProgress?.(Math.min(i + batchSize, total), total, `\u5DF2\u5B8C\u6210 ${count}/${total} \u5F20\u5361\u7247`);
      } catch (e) {
        console.warn(`[RAG] Enrich batch error:`, e);
        onProgress?.(i, total, `\u6279\u6B21\u5931\u8D25: ${String(e).substring(0, 50)}`);
      }
    }
    onProgress?.(total, total, `\u5B8C\u6210\uFF01\u5171\u66F4\u65B0 ${count} \u5F20\u5361\u7247`);
    if (count) {
      console.log(`[RAG] LLM enriched ${count} index cards`);
    }
    return count;
  }
  getCardFiles() {
    const dir = this.vault.getAbstractFileByPath(INDEX_DIR);
    if (!(dir instanceof import_obsidian3.TFolder))
      return [];
    return dir.children.filter((c) => c instanceof import_obsidian3.TFile && c.extension === "md");
  }
  parseYamlList(raw) {
    if (!raw)
      return [];
    if (raw.includes("\n")) {
      return raw.split("\n").filter((l) => l.trim()).map((l) => l.trim().replace(/^["']|["']$/g, ""));
    }
    return raw.split(",").filter((x) => x.trim()).map((x) => x.trim().replace(/^["']|["']$/g, ""));
  }
  // ── Link validation ──────────────────────────────────────
  async validateLinks(links) {
    const valid = [];
    for (const link of links) {
      const clean = link.replace(/\.md$/, "");
      const file = this.vault.getAbstractFileByPath(clean + ".md");
      if (file instanceof import_obsidian3.TFile) {
        valid.push(link);
        continue;
      }
      const resolved = this.vault.getAbstractFileByPath(link);
      if (resolved instanceof import_obsidian3.TFile) {
        valid.push(link);
      }
    }
    return valid;
  }
  // ── Parsing helpers ──────────────────────────────────────
  parseFrontmatter(content) {
    const fm = {};
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match)
      return fm;
    const lines = match[1].split("\n");
    let currentKey = null;
    let currentList = [];
    for (const line of lines) {
      const listMatch = line.match(/^\s{2,}-\s+(.+)$/);
      if (listMatch && currentKey) {
        currentList.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
        continue;
      }
      if (currentKey && currentList.length) {
        fm[currentKey] = currentList.join("\n");
        currentList = [];
        currentKey = null;
      }
      const kv = line.match(/^([\w_]+)\s*:\s*(.*)$/);
      if (kv) {
        const key = kv[1];
        const val = kv[2].trim().replace(/^["']|["']$/g, "");
        if (val) {
          fm[key] = val;
        } else {
          currentKey = key;
          currentList = [];
        }
      }
    }
    if (currentKey && currentList.length) {
      fm[currentKey] = currentList.join("\n");
    }
    return fm;
  }
  stripFrontmatter(content) {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  }
  extractTitle(body, fallback) {
    for (const line of body.split("\n")) {
      const match = line.trim().match(/^#\s+(.+)$/);
      if (match)
        return match[1].trim();
    }
    return fallback;
  }
  extractWikiLinks(content) {
    const links = [];
    const seen = /* @__PURE__ */ new Set();
    const regex = /\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const link = match[1].trim();
      if (link.match(/\.(png|jpg|jpeg|gif|svg|webp|pdf|mp4|mp3|zip|rar)$/i))
        continue;
      const lower = link.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        links.push(link);
      }
    }
    return links;
  }
  extractTags(content, fm) {
    const tags = [];
    if (fm.tags && fm.tags !== "[]") {
      const tagList = fm.tags.split("\n").length > 1 ? fm.tags.split("\n") : fm.tags.split(",");
      for (const t of tagList) {
        const clean = t.trim().replace(/^["']|["']$/g, "").replace(/^-\s+/, "");
        if (clean && clean !== "[]")
          tags.push(clean);
      }
    }
    const inlineRegex = /(?:^|\s)#([一-鿿\w]{2,})/g;
    let match;
    while ((match = inlineRegex.exec(content)) !== null) {
      if (!tags.includes(match[1]))
        tags.push(match[1]);
    }
    return tags;
  }
  extractHeadings(body) {
    const headings = [];
    const regex = /^#{1,3}\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(body)) !== null) {
      headings.push(match[1].trim());
    }
    return headings;
  }
  extractDomain(path) {
    const parts = path.split("/");
    return parts.length > 1 ? parts[0] : "";
  }
  extractOneLineSummary(body) {
    for (const line of body.split("\n")) {
      const stripped = line.trim();
      if (stripped && !stripped.startsWith("#")) {
        return stripped.substring(0, 150);
      }
    }
    return "";
  }
  extractKeywords(content, title) {
    const keywords = [];
    if (title)
      keywords.push(title.replace(/[#\-_]/g, " ").trim());
    const words = content.match(/[一-鿿]{2,}|[a-zA-Z]{3,}/g) || [];
    const freq = {};
    for (const w of words) {
      const lower = w.toLowerCase();
      freq[lower] = (freq[lower] || 0) + 1;
    }
    const titleLower = title.toLowerCase();
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    for (const [word, count] of sorted) {
      if (count < 3)
        break;
      if (!titleLower.includes(word) && word.length >= 2) {
        keywords.push(word);
      }
      if (keywords.length >= 8)
        break;
    }
    return keywords;
  }
  inferNoteRole(content) {
    const patterns = [
      ["howto", /(?:^|\n)##?\s*(?:步骤|操作|方法|如何|怎么|教程|Step)/i],
      ["reference", /(?:^|\n)##?\s*(?:参考|Ref|API|参数|配置|字段|属性)/i],
      ["concept", /(?:^|\n)##?\s*(?:原理|概念|理论|机制|定义|什么是)/i],
      ["project", /(?:^|\n)##?\s*(?:进度|计划|TODO|任务|里程碑)/i],
      ["moc", /(?:^|\n)##?\s*(?:目录|索引|导航|MOC|Map)/i]
    ];
    for (const [role, pattern] of patterns) {
      if (pattern.test(content))
        return role;
    }
    return "mixed";
  }
  extractHashFromFrontmatter(cardContent) {
    const match = cardContent.match(/source_hash:\s*"([a-f0-9]+)"/);
    return match ? match[1] : "";
  }
  // ── Build card file ──────────────────────────────────────
  buildCardFile(data, enriched) {
    const escape = (s) => s.replace(/"/g, '\\"').replace(/\n/g, " ");
    const lines = [
      `doc_id: "${escape(data.docId)}"`,
      `title: "${escape(data.title)}"`,
      `path: "${escape(data.path)}"`,
      `scope: "${data.scope}"`,
      `domain: "${escape(data.domain)}"`,
      `topic_primary: "${escape(data.topicPrimary)}"`,
      `one_line_summary: "${escape(data.oneLineSummary)}"`,
      `note_role: "${data.noteRole}"`,
      `source_hash: "${data.sourceHash}"`,
      `build_status: "success"`,
      `generated_at: "${(/* @__PURE__ */ new Date()).toISOString()}"`
    ];
    if (data.tags.length) {
      lines.push("tags:");
      for (const tag of data.tags.slice(0, 10))
        lines.push(`  - "${escape(tag)}"`);
    } else {
      lines.push("tags: []");
    }
    if (data.headings.length) {
      lines.push("headings:");
      for (const h of data.headings.slice(0, 20))
        lines.push(`  - "${escape(h)}"`);
    } else {
      lines.push("headings: []");
    }
    if (data.retrievalKeywords.length) {
      lines.push("retrieval_keywords:");
      for (const kw of data.retrievalKeywords.slice(0, 8))
        lines.push(`  - "${escape(kw)}"`);
    } else {
      lines.push("retrieval_keywords: []");
    }
    if (data.outlinks.length) {
      lines.push("outlinks:");
      for (const link of data.outlinks.slice(0, 20))
        lines.push(`  - "${escape(link)}"`);
    } else {
      lines.push("outlinks: []");
    }
    const ts = enriched?.topicSecondary || [];
    const qt = enriched?.questionTypes || [];
    const bf = enriched?.bestFor || [];
    const nf = enriched?.notFor || [];
    const rw = enriched?.readWith || [];
    if (ts.length) {
      lines.push("topic_secondary:");
      for (const t of ts)
        lines.push(`  - "${escape(t)}"`);
    } else {
      lines.push("topic_secondary: []");
    }
    if (qt.length) {
      lines.push("question_types:");
      for (const q of qt)
        lines.push(`  - "${escape(q)}"`);
    } else {
      lines.push("question_types: []");
    }
    if (bf.length) {
      lines.push("best_for:");
      for (const b of bf)
        lines.push(`  - "${escape(b)}"`);
    } else {
      lines.push("best_for: []");
    }
    if (nf.length) {
      lines.push("not_for:");
      for (const n of nf)
        lines.push(`  - "${escape(n)}"`);
    } else {
      lines.push("not_for: []");
    }
    if (rw.length) {
      lines.push("read_with:");
      for (const r of rw)
        lines.push(`  - "${escape(r)}"`);
    } else {
      lines.push("read_with: []");
    }
    const fm = lines.join("\n") + "\n";
    return `---
${fm}---

# ${data.title}

${data.oneLineSummary}`;
  }
};

// src/ui/main-view.ts
var import_obsidian4 = require("obsidian");
var VIEW_TYPE_RAG = "enhanced-rag-view";
var MainRAGView = class extends import_obsidian4.ItemView {
  constructor(leaf) {
    super(leaf);
    this.messages = [];
    this.threadEl = null;
    this.inputEl = null;
    this.statusEl = null;
    this.onSearch = null;
    this.onSelectResult = null;
    this.onSelectUnit = null;
  }
  getViewType() {
    return VIEW_TYPE_RAG;
  }
  getDisplayText() {
    return "Enhanced RAG";
  }
  getIcon() {
    return "brain";
  }
  async onOpen() {
    this.renderLayout();
    this.setStatus("\u5C31\u7EEA");
  }
  setOnSearch(callback) {
    this.onSearch = callback;
  }
  setOnSelectResult(callback) {
    this.onSelectResult = callback;
  }
  setOnSelectUnit(callback) {
    this.onSelectUnit = callback;
  }
  /**
   * Render the main layout: header + thread + composer
   */
  renderLayout() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("rag-chat-view");
    const header = contentEl.createDiv({ cls: "rag-chat-header" });
    header.createEl("h3", { text: "\u{1F4AC} Enhanced RAG" });
    this.statusEl = header.createDiv({ cls: "rag-chat-status" });
    const actions = header.createDiv({ cls: "rag-chat-actions" });
    this.makeBtn(actions, "\u{1F4AC} \u65B0\u4F1A\u8BDD", () => this.clearMessages());
    this.threadEl = contentEl.createDiv({ cls: "rag-chat-thread" });
    this.renderMessages();
    const composer = contentEl.createDiv({ cls: "rag-chat-composer" });
    this.inputEl = composer.createEl("textarea", {
      cls: "rag-chat-input",
      attr: { placeholder: "\u8F93\u5165\u95EE\u9898\uFF0CEnter \u53D1\u9001\uFF0CShift+Enter \u6362\u884C" }
    });
    this.inputEl.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await this.sendMessage();
      }
    });
    const footer = composer.createDiv({ cls: "rag-chat-footer" });
    this.makeBtn(footer, "\u53D1\u9001", () => this.sendMessage()).addClass("rag-chat-send");
  }
  makeBtn(parent, text, onClick) {
    const btn = parent.createEl("button", { text, cls: "rag-chat-btn" });
    btn.addEventListener("click", onClick);
    return btn;
  }
  setStatus(text) {
    if (this.statusEl)
      this.statusEl.setText(text);
  }
  /**
   * Render all messages in the thread
   */
  renderMessages() {
    if (!this.threadEl)
      return;
    this.threadEl.empty();
    if (this.messages.length === 0) {
      this.threadEl.createDiv({
        cls: "rag-chat-empty",
        text: "\u8F93\u5165\u95EE\u9898\u5F00\u59CB\u5BF9\u8BDD\u3002\u57FA\u4E8E\u4F60\u7684\u7B14\u8BB0\u5E93\u68C0\u7D22\u5E76\u56DE\u7B54\u3002"
      });
      return;
    }
    for (const msg of this.messages) {
      const wrap = this.threadEl.createDiv({ cls: `rag-chat-message ${msg.role}` });
      if (msg.role === "assistant" && msg.sources?.length) {
        const sources = wrap.createDiv({ cls: "rag-chat-sources" });
        sources.createSpan({ text: "\u{1F4C4} \u6765\u6E90\uFF1A" });
        for (const src of msg.sources) {
          const link = sources.createEl("a", {
            text: src.title,
            cls: "rag-chat-source-link",
            attr: { title: src.path }
          });
          link.addEventListener("click", (e) => {
            e.preventDefault();
            this.openFile(src.path);
          });
          sources.createSpan({ text: " " });
        }
      }
      const bubble = wrap.createDiv({ cls: "rag-chat-bubble" });
      if (msg.streaming) {
        bubble.createSpan({ text: msg.content || "\u601D\u8003\u4E2D..." });
      } else {
        import_obsidian4.MarkdownRenderer.render(this.app, msg.content, bubble, "", this);
      }
    }
    this.threadEl.scrollTop = this.threadEl.scrollHeight;
  }
  async openFile(path) {
    if (this.app.vault.getAbstractFileByPath(path)) {
      await this.app.workspace.openLinkText(path, "", true);
    }
  }
  clearMessages() {
    this.messages = [];
    this.renderMessages();
  }
  /**
   * Send message: extract input, call search+LLM, stream response
   */
  async sendMessage() {
    if (!this.inputEl)
      return;
    const query = this.inputEl.value.trim();
    if (!query)
      return;
    if (!this.onSearch) {
      new import_obsidian4.Notice("\u641C\u7D22\u56DE\u8C03\u672A\u8BBE\u7F6E");
      return;
    }
    this.messages.push({ role: "user", content: query });
    this.inputEl.value = "";
    const assistantMsg = { role: "assistant", content: "", streaming: true };
    this.messages.push(assistantMsg);
    this.renderMessages();
    this.setStatus("\u6B63\u5728\u68C0\u7D22...");
    try {
      const result = await this.onSearch(query, (token) => {
        assistantMsg.content += token;
        assistantMsg.streaming = true;
        this.renderMessages();
      });
      assistantMsg.content = result.answer;
      assistantMsg.sources = result.sources;
      assistantMsg.streaming = false;
      this.setStatus(`\u68C0\u7D22\u5B8C\u6210\uFF0C\u5F15\u7528\u4E86 ${result.sources.length} \u4E2A\u6587\u4EF6`);
    } catch (e) {
      assistantMsg.content = `\u274C \u9519\u8BEF\uFF1A${e.message}`;
      assistantMsg.streaming = false;
      this.setStatus("\u67E5\u8BE2\u5931\u8D25");
    }
    this.renderMessages();
  }
  async onClose() {
  }
};

// src/ui/unit-view.ts
var import_obsidian5 = require("obsidian");
var VIEW_TYPE_RAG_UNIT = "enhanced-rag-unit-view";
var UnitDetailView = class extends import_obsidian5.ItemView {
  constructor(leaf) {
    super(leaf);
    this.unit = null;
  }
  getViewType() {
    return VIEW_TYPE_RAG_UNIT;
  }
  getDisplayText() {
    return this.unit ? `\u77E5\u8BC6\u5355\u5143: ${this.unit.topic}` : "\u77E5\u8BC6\u5355\u5143\u8BE6\u60C5";
  }
  getIcon() {
    return "book-open";
  }
  async onOpen() {
    this.render();
  }
  setUnit(unit) {
    this.unit = unit;
    this.render();
  }
  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("rag-unit-detail");
    if (!this.unit) {
      container.createEl("p", { text: "\u8BF7\u9009\u62E9\u4E00\u4E2A\u77E5\u8BC6\u5355\u5143\u67E5\u770B\u8BE6\u60C5" });
      return;
    }
    container.createEl("h2", { text: this.unit.topic });
    const meta = container.createDiv("rag-unit-detail-meta");
    meta.createEl("span", { text: `\u76F8\u5173\u6027: ${this.unit.relevanceScore.toFixed(2)}` });
    meta.createEl("span", { text: `\u6E90\u6587\u6863\u6570: ${this.unit.sourceCount}` });
    if (this.unit.historyBoost > 0) {
      meta.createEl("span", { text: `\u5386\u53F2\u52A0\u6210: +${this.unit.historyBoost.toFixed(2)}` });
    }
    container.createEl("h3", { text: "\u6458\u8981" });
    container.createEl("p", { text: this.unit.summary, cls: "rag-unit-detail-summary" });
    if (this.unit.keyPoints.length > 0) {
      container.createEl("h3", { text: "\u5173\u952E\u70B9" });
      const list = container.createEl("ul");
      for (const point of this.unit.keyPoints) {
        list.createEl("li", { text: point });
      }
    }
    if (this.unit.suggestedUsage) {
      container.createEl("h3", { text: "\u5EFA\u8BAE\u4F7F\u7528" });
      container.createEl("p", { text: this.unit.suggestedUsage });
    }
    if (this.unit.sourceDocuments.length > 0) {
      container.createEl("h3", { text: "\u6E90\u6587\u6863" });
      const list = container.createEl("ul", { cls: "rag-source-list" });
      for (const docId of this.unit.sourceDocuments) {
        const item = list.createEl("li");
        const link = item.createEl("a", { text: docId });
        link.href = "#";
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const file = this.app.vault.getAbstractFileByPath(docId);
          if (file) {
            this.app.workspace.openLinkText(docId, "");
          }
        });
      }
    }
  }
};

// src/ui/history-view.ts
var import_obsidian6 = require("obsidian");
var VIEW_TYPE_RAG_HISTORY = "enhanced-rag-history-view";
var HistoryView = class extends import_obsidian6.ItemView {
  constructor(leaf) {
    super(leaf);
    this.queries = [];
    this.onSelectQuery = null;
  }
  getViewType() {
    return VIEW_TYPE_RAG_HISTORY;
  }
  getDisplayText() {
    return "\u67E5\u8BE2\u5386\u53F2";
  }
  getIcon() {
    return "history";
  }
  async onOpen() {
    this.render();
  }
  setQueries(queries) {
    this.queries = queries;
    this.render();
  }
  setOnSelectQuery(callback) {
    this.onSelectQuery = callback;
  }
  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("rag-history-view");
    container.createEl("h3", { text: "\u6700\u8FD1\u67E5\u8BE2" });
    if (this.queries.length === 0) {
      container.createEl("p", { text: "\u6682\u65E0\u67E5\u8BE2\u5386\u53F2", cls: "rag-history-empty" });
      return;
    }
    const list = container.createDiv("rag-history-list");
    for (const query of this.queries) {
      const item = list.createDiv("rag-history-item");
      const text = item.createDiv("rag-history-text");
      text.setText(query.text);
      const meta = item.createDiv("rag-history-meta");
      const date = new Date(query.timestamp);
      meta.setText(`${date.toLocaleDateString()} | ${query.retrievedCount} \u7ED3\u679C`);
      item.addEventListener("click", () => {
        if (this.onSelectQuery) {
          this.onSelectQuery(query.text);
        }
      });
    }
  }
};

// src/main.ts
var CHAT_SYSTEM_PROMPT = `\u4F60\u662F\u4E00\u4E2A\u57FA\u4E8E\u7528\u6237\u7B14\u8BB0\u5E93\u7684\u95EE\u7B54\u52A9\u624B\u3002

## \u89C4\u5219
1. \u53EA\u57FA\u4E8E\u63D0\u4F9B\u7684\u7B14\u8BB0\u5185\u5BB9\u56DE\u7B54\uFF0C\u4E0D\u8981\u7F16\u9020\u4FE1\u606F
2. \u5982\u679C\u7B14\u8BB0\u5185\u5BB9\u4E0D\u8DB3\u4EE5\u56DE\u7B54\u95EE\u9898\uFF0C\u660E\u786E\u8BF4\u660E\u54EA\u4E9B\u90E8\u5206\u7F3A\u4E4F\u4F9D\u636E
3. \u6BCF\u4E2A\u5173\u952E\u4E8B\u5B9E\u90FD\u8981\u6807\u6CE8\u6765\u6E90\u6587\u4EF6\u8DEF\u5F84
4. \u56DE\u7B54\u8981\u7B80\u6D01\u6709\u7528\uFF0C\u4E0D\u8981\u5197\u957F
5. \u5982\u679C\u627E\u5230\u591A\u4E2A\u76F8\u5173\u7B14\u8BB0\uFF0C\u7EFC\u5408\u6574\u7406\u800C\u975E\u7B80\u5355\u7F57\u5217

## \u6765\u6E90\u6807\u6CE8\u683C\u5F0F
\u5728\u6BCF\u4E2A\u5173\u952E\u4E8B\u5B9E\u540E\u7528\u4EE5\u4E0B\u683C\u5F0F\u6807\u6CE8\u6765\u6E90\uFF1A
> \u{1F4C4} \u6765\u6E90\uFF1A\`\u8DEF\u5F84/\u6587\u4EF6\u540D.md\`

## \u8F93\u51FA\u683C\u5F0F
\u7528 markdown \u683C\u5F0F\u8F93\u51FA\uFF0C\u7ED3\u6784\u6E05\u6670\u3002`;
function buildPipelinePrompt(query, ranked, cards, contentMap, knowledgeUnits) {
  let prompt = `## \u7528\u6237\u95EE\u9898
${query}

`;
  if (knowledgeUnits?.length) {
    prompt += `## \u77E5\u8BC6\u5355\u5143\u6574\u7406
`;
    for (let i = 0; i < Math.min(knowledgeUnits.length, 5); i++) {
      const ku = knowledgeUnits[i];
      prompt += `### ${ku.topic}
${ku.summary}
`;
      if (ku.keyPoints?.length) {
        prompt += ku.keyPoints.map((p) => `- ${p}`).join("\n") + "\n";
      }
      prompt += "\n";
    }
    prompt += "---\n\n";
  }
  prompt += `## \u76F8\u5173\u7B14\u8BB0

`;
  for (let i = 0; i < Math.min(ranked.length, 10); i++) {
    const r = ranked[i];
    const tag = r.fromExpansion ? " [\u62D3\u5C55]" : "";
    prompt += `### [${i + 1}] ${r.title}${tag}
\u8DEF\u5F84\uFF1A\`${r.path}\`
`;
    const content = contentMap?.get(r.docId) || r.snippet;
    if (content)
      prompt += `\u5185\u5BB9\uFF1A${content}
`;
    prompt += "\n";
  }
  return prompt;
}
var EnhancedRAGPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    this.mainView = null;
  }
  async onload() {
    await this.loadSettings();
    const pluginDir = `${this.app.vault.configDir}/plugins/obsidian-enhanced-rag`;
    this.retrievalManager = new RetrievalManager(this.app.vault, this.settings);
    this.resultFusion = new ResultFusion();
    this.queryAnalyzer = new QueryAnalyzer();
    this.knowledgeGenerator = new KnowledgeGenerator(this.app.vault, this.settings);
    this.historyManager = new HistoryManager(this.app, pluginDir, this.settings.historyRetentionDays);
    this.cloudCache = new CloudCache(this.settings.cacheSize);
    this.cardGenerator = new CardGenerator(this.app.vault);
    this.retrievalManager.setKnowledgeGenerator(this.knowledgeGenerator);
    this.registerView(VIEW_TYPE_RAG, (leaf) => {
      this.mainView = new MainRAGView(leaf);
      this.setupMainViewCallbacks();
      return this.mainView;
    });
    this.registerView(VIEW_TYPE_RAG_UNIT, (leaf) => new UnitDetailView(leaf));
    this.registerView(VIEW_TYPE_RAG_HISTORY, (leaf) => new HistoryView(leaf));
    this.addRibbonIcon("brain", "\u6253\u5F00 RAG \u641C\u7D22", () => this.activateView());
    this.addCommand({
      id: "open-rag-search",
      name: "\u6253\u5F00 RAG \u641C\u7D22",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "rag-search",
      name: "RAG \u641C\u7D22",
      callback: () => {
        this.activateView();
      }
    });
    this.addCommand({
      id: "rebuild-indexes",
      name: "\u91CD\u5EFA\u68C0\u7D22\u7D22\u5F15",
      callback: () => this.rebuildIndexes()
    });
    this.addCommand({
      id: "rebuild-index-cards",
      name: "\u91CD\u5EFA\u7D22\u5F15\u5361",
      callback: () => this.rebuildIndexCards()
    });
    this.addSettingTab(new RAGSettingTab(this.app, this));
    this.registerEvent(
      this.app.vault.on("modify", (file) => this.onFileModify(file))
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => this.onFileDelete(file))
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => this.onFileRename(file, oldPath))
    );
    await this.historyManager.init();
    this.retrievalManager.buildIndexes().catch((err) => {
      console.error("[RAG] Failed to build indexes:", err);
    });
    console.log("[RAG] Plugin loaded");
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG_UNIT);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG_HISTORY);
    console.log("[RAG] Plugin unloaded");
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.retrievalManager?.updateSettings(this.settings);
    this.knowledgeGenerator?.updateSettings(this.settings);
  }
  /**
   * Activate the main RAG view
   */
  async activateView() {
    const { workspace } = this.app;
    let leaf = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_RAG);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_RAG, active: true });
      }
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
  /**
   * Setup callbacks for the main view
   */
  setupMainViewCallbacks() {
    if (!this.mainView)
      return;
    this.mainView.setOnSearch(async (query, onToken) => {
      return await this.chatQuery(query, onToken);
    });
    this.mainView.setOnSelectResult((result) => {
      this.app.workspace.openLinkText(result.path, "");
      this.historyManager.recordInteraction(result.docId, "click");
    });
    this.mainView.setOnSelectUnit((unit) => {
      this.openUnitDetail(unit);
    });
  }
  /**
   * Chat query: pipeline retrieval → stream LLM answer
   */
  async chatQuery(query, onToken) {
    if (!this.settings.apiKey) {
      throw new Error("API key not configured. Please set it in plugin settings.");
    }
    const { ranked, cards } = await this.retrievalManager.pipelineSearch(query, 10);
    const topicPreferences = this.historyManager.getTopicPreferences();
    const boosted = this.resultFusion.applyHistoryBoost(ranked, topicPreferences);
    if (boosted.length === 0) {
      return { answer: "\u26A0\uFE0F \u672A\u627E\u5230\u76F8\u5173\u7B14\u8BB0\uFF0C\u8BF7\u5C1D\u8BD5\u4E0D\u540C\u7684\u5173\u952E\u8BCD\u3002", sources: [] };
    }
    const contentMap = /* @__PURE__ */ new Map();
    for (const article of boosted) {
      const file = this.app.vault.getAbstractFileByPath(article.path);
      if (file && "stat" in file) {
        try {
          const content = await this.app.vault.cachedRead(file);
          contentMap.set(article.docId, content);
        } catch {
        }
      }
    }
    let knowledgeUnits = [];
    if (this.settings.showKnowledgeUnits) {
      try {
        const fusedResults = boosted.map((r) => ({
          docId: r.docId,
          title: r.title,
          path: r.path,
          finalScore: r.finalScore,
          scoreBreakdown: { keywordScore: 0, indexScore: 0, vectorScore: 0 },
          snippet: r.snippet
        }));
        const history = this.historyManager.getHistory();
        knowledgeUnits = await this.knowledgeGenerator.generate(fusedResults, query, history);
      } catch (e) {
        console.warn("[RAG] Knowledge unit generation failed:", e);
      }
    }
    const userPrompt = buildPipelinePrompt(query, boosted, cards, contentMap, knowledgeUnits);
    const url = `${this.settings.apiBaseUrl}/chat/completions`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.chatModel,
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        stream: true
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API error (${resp.status}): ${errText}`);
    }
    const reader = resp.body?.getReader();
    if (!reader)
      throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u6D41\u5F0F\u54CD\u5E94");
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: "))
          continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === "[DONE]")
          continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onToken(delta);
          }
        } catch {
        }
      }
    }
    const sourceMap = /* @__PURE__ */ new Map();
    for (const r of boosted.slice(0, 10)) {
      if (!sourceMap.has(r.path)) {
        sourceMap.set(r.path, { path: r.path, title: r.title });
      }
    }
    await this.historyManager.recordQuery(query, []);
    return { answer: fullContent, sources: Array.from(sourceMap.values()) };
  }
  // performSearch removed - chat UI now uses chatQuery directly
  /**
   * Open knowledge unit detail view
   */
  async openUnitDetail(unit) {
    const { workspace } = this.app;
    let leaf = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_RAG_UNIT);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_RAG_UNIT, active: true });
      }
    }
    if (leaf) {
      const view = leaf.view;
      if (view instanceof UnitDetailView) {
        view.setUnit(unit);
      }
      workspace.revealLeaf(leaf);
    }
  }
  /**
   * Rebuild all indexes
   */
  async rebuildIndexes() {
    new import_obsidian7.Notice("\u6B63\u5728\u91CD\u5EFA\u7D22\u5F15...");
    try {
      await this.retrievalManager.buildIndexes();
      new import_obsidian7.Notice("\u7D22\u5F15\u91CD\u5EFA\u5B8C\u6210");
    } catch (error) {
      console.error("[RAG] Index rebuild failed:", error);
      new import_obsidian7.Notice(`\u7D22\u5F15\u91CD\u5EFA\u5931\u8D25: ${error.message}`);
    }
  }
  /**
   * Rebuild all index cards
   */
  async rebuildIndexCards() {
    new import_obsidian7.Notice("\u6B63\u5728\u91CD\u5EFA\u7D22\u5F15\u5361...");
    try {
      const count = await this.cardGenerator.generateAll(true);
      new import_obsidian7.Notice(`\u7D22\u5F15\u5361\u91CD\u5EFA\u5B8C\u6210\uFF1A\u751F\u6210 ${count} \u5F20`);
    } catch (error) {
      console.error("[RAG] Index card rebuild failed:", error);
      new import_obsidian7.Notice(`\u7D22\u5F15\u5361\u91CD\u5EFA\u5931\u8D25: ${error.message}`);
    }
  }
  /**
   * Enrich index cards with LLM semantic fields
   */
  async enrichIndexCards() {
    const notice = new import_obsidian7.Notice("\u6B63\u5728\u8C03\u7528 LLM \u586B\u5145\u8BED\u4E49\u5B57\u6BB5...", 0);
    try {
      const count = await this.cardGenerator.enrichCards(
        this.settings.apiKey,
        this.settings.apiBaseUrl,
        this.settings.enrichModel,
        (current, total, stage) => {
          notice.setMessage(`LLM \u586B\u5145: ${stage}`);
        }
      );
      notice.setMessage(`LLM \u586B\u5145\u5B8C\u6210\uFF1A\u66F4\u65B0 ${count} \u5F20\u7D22\u5F15\u5361`);
      setTimeout(() => notice.hide(), 5e3);
    } catch (error) {
      console.error("[RAG] Card enrichment failed:", error);
      notice.setMessage(`\u8BED\u4E49\u5B57\u6BB5\u586B\u5145\u5931\u8D25: ${error.message}`);
      setTimeout(() => notice.hide(), 8e3);
    }
  }
  /**
   * Clear all caches
   */
  async clearCache() {
    this.cloudCache.clear();
    new import_obsidian7.Notice("\u7F13\u5B58\u5DF2\u6E05\u9664");
  }
  /**
   * Clear all history
   */
  async clearHistory() {
    await this.historyManager.clearHistory();
    new import_obsidian7.Notice("\u5386\u53F2\u5DF2\u91CD\u7F6E");
  }
  /**
   * Handle file modifications for incremental indexing
   */
  async onFileModify(file) {
    if (file instanceof import_obsidian7.TFile && file.extension === "md") {
      if (file.path.startsWith("00_INDEX/"))
        return;
      await this.retrievalManager.updateDocument(file.path);
      if (this.settings.autoGenerateCards) {
        await this.cardGenerator.generateCard(file);
      }
    }
  }
  /**
   * Handle file deletion for index cleanup
   */
  async onFileDelete(file) {
    if (file instanceof import_obsidian7.TFile) {
      this.retrievalManager.removeDocument(file.path);
      if (file.extension === "md" && this.settings.autoGenerateCards) {
        await this.cardGenerator.deleteCard(file.basename);
      }
    }
  }
  /**
   * Handle file rename for index update
   */
  async onFileRename(file, oldPath) {
    if (file instanceof import_obsidian7.TFile && file.extension === "md") {
      if (file.path.startsWith("00_INDEX/"))
        return;
      this.retrievalManager.removeDocument(oldPath);
      await this.retrievalManager.updateDocument(file.path);
      if (this.settings.autoGenerateCards) {
        const oldName = oldPath.split("/").pop()?.replace(/\.md$/, "") || "";
        await this.cardGenerator.renameCard(oldName, file);
      }
    }
  }
};
