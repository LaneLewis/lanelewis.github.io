
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/Logo.svelte generated by Svelte v3.43.0 */

    const file$7 = "src/Logo.svelte";

    function create_fragment$7(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./images/personal_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "logobackground2 svelte-pjbp0s");
    			attr_dev(img, "alt", "responsive");
    			set_style(img, "box-shadow", "inset 0px -" + /*squareSize*/ ctx[0] / 30 + "px " + /*squareSize*/ ctx[0] / 50 + "px " + /*squareSize*/ ctx[0] / 100 + "px #292b2c");
    			set_style(img, "width", /*squareSize*/ ctx[0] + "px");
    			set_style(img, "height", /*squareSize*/ ctx[0] + "px");
    			add_location(img, file$7, 10, 0, 162);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*squareSize*/ 1) {
    				set_style(img, "box-shadow", "inset 0px -" + /*squareSize*/ ctx[0] / 30 + "px " + /*squareSize*/ ctx[0] / 50 + "px " + /*squareSize*/ ctx[0] / 100 + "px #292b2c");
    			}

    			if (dirty & /*squareSize*/ 1) {
    				set_style(img, "width", /*squareSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*squareSize*/ 1) {
    				set_style(img, "height", /*squareSize*/ ctx[0] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Logo', slots, []);
    	let { squareSize = "100" } = $$props;
    	const writable_props = ['squareSize'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('squareSize' in $$props) $$invalidate(0, squareSize = $$props.squareSize);
    	};

    	$$self.$capture_state = () => ({ squareSize });

    	$$self.$inject_state = $$props => {
    		if ('squareSize' in $$props) $$invalidate(0, squareSize = $$props.squareSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [squareSize];
    }

    class Logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { squareSize: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get squareSize() {
    		throw new Error("<Logo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set squareSize(value) {
    		throw new Error("<Logo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Projects/Kalman.md generated by Svelte v3.43.0 */

    const file$6 = "src/Projects/Kalman.md";

    function create_fragment$6(ctx) {
    	let h1;
    	let t1;
    	let h2;
    	let t2;
    	let a;
    	let t4;
    	let hr;
    	let t5;
    	let p0;
    	let t7;
    	let p1;
    	let t8;
    	let em;
    	let t10;
    	let t11;
    	let img;
    	let img_src_value;
    	let t12;
    	let p2;
    	let t14;
    	let p3;
    	let t15;
    	let sub0;
    	let t17;
    	let sub1;
    	let t19;
    	let br0;
    	let t20;
    	let sub2;
    	let sup0;
    	let t23;
    	let sup1;
    	let t25;
    	let sub3;
    	let sup2;
    	let t28;
    	let sup3;
    	let t30;
    	let br1;
    	let t31;
    	let sub4;
    	let sup4;
    	let t34;
    	let sub5;
    	let sup5;
    	let t37;
    	let sub6;
    	let sup6;
    	let t40;
    	let br2;
    	let t41;
    	let sub7;
    	let t43;
    	let sub8;
    	let t45;
    	let sub9;
    	let sup7;
    	let t48;
    	let sub10;
    	let t50;
    	let sub11;
    	let sup8;
    	let t53;
    	let sub12;
    	let t55;
    	let p4;
    	let t57;
    	let p5;
    	let t58;
    	let sub13;
    	let sup9;
    	let t61;
    	let sub14;
    	let t63;
    	let sub15;
    	let sup10;
    	let t66;
    	let sub16;
    	let t68;
    	let sub17;
    	let sup11;
    	let t71;
    	let sub18;
    	let t73;
    	let p6;
    	let t74;
    	let sup12;
    	let t76;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Implementing Kalman Filters into Neural Hardware";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text("With Robert Wilson, Summer 2020. ");
    			a = element("a");
    			a.textContent = "Poster Presentation";
    			t4 = space();
    			hr = element("hr");
    			t5 = text("\nDo humans and other animals' brains naturally implement an algorithm commonly used in radar? There seems to be some evidence from recent psychology research that they do! The Kalman Filter is a bayesian inference based estimator that fuses together past information with new information to create informed estimates on the current state of an object. One of its first uses was on the apollo missions, predicting the location of the spaceships from their onboard computer. Since then, they have been used in a very large number of areas including missiles, biometric sensors, and radar.  \n\n");
    			p0 = element("p");
    			p0.textContent = "The framework of bayesian inference is a theory of probability that allows for the existance of beliefs about the parameters of probability distributions and is concerned with how to change those beliefs in optimal ways as more data is collected. The Kalman Filter gives the optimal way to update beliefs about an object when both the prior belief on the location of the object is a normal distribution as well as all the observations, and the object is moving linearly in space.";
    			t7 = space();
    			p1 = element("p");
    			t8 = text("If we are able to observe animals behaving in a way that fits into a bayesian framework, the next question is how would their brains actually implement them? One mathematical model for how animals keep track of their position in space and time is through network attractor dynamics. In this model, neurons work collectively to maintain steady state activity 'bumps' on a coordinate system that translates to their position in real life. These bumps serve as an internal position model and can move over time as the animal senses themselves moving. We can then see what would happen if new information on the animals position was aquired, and another bump were added to the network. If we treat the height of the createures position bump as proportional to the variance of their internal model, and choose an activation function with divisive inhibition, we can use the dynamics of the network to approximate a Kalman Filter. This model was previously worked out by Wilson and Finkel in ");
    			em = element("em");
    			em.textContent = "A Neural Implementation of the Kalman Filter";
    			t10 = text(".");
    			t11 = space();
    			img = element("img");
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "However, this model has a limitation in that it only works for a single dimensional Kalman Filter. In this summer project, I worked to extend it to approximate any arbitrary dimensional Kalman Filter. One major difficulty I had to overcome in building this is that the typical Kalman Filter equations involve a matrix inversion, which isn't a type of computation possible in the neural hardware unless there is no correlation between the variables. However if we rewrite the Kalman Filter equations as (assuming all variables are observed):";
    			t14 = space();
    			p3 = element("p");
    			t15 = text("μ");
    			sub0 = element("sub");
    			sub0.textContent = "t−";
    			t17 = text(" = Aμ");
    			sub1 = element("sub");
    			sub1.textContent = "(t−1)+";
    			t19 = text(" + b\n  ");
    			br0 = element("br");
    			t20 = text("\n  Σ");
    			sub2 = element("sub");
    			sub2.textContent = "t−";
    			sup0 = element("sup");
    			sup0.textContent = "−1";
    			t23 = text(" = A");
    			sup1 = element("sup");
    			sup1.textContent = "−1";
    			t25 = text("Σ");
    			sub3 = element("sub");
    			sub3.textContent = "(t−1)+";
    			sup2 = element("sup");
    			sup2.textContent = "−1";
    			t28 = text("A");
    			sup3 = element("sup");
    			sup3.textContent = "−T";
    			t30 = space();
    			br1 = element("br");
    			t31 = text("\n  Σ");
    			sub4 = element("sub");
    			sub4.textContent = "t+";
    			sup4 = element("sup");
    			sup4.textContent = "−1";
    			t34 = text(" = Σ");
    			sub5 = element("sub");
    			sub5.textContent = "t−";
    			sup5 = element("sup");
    			sup5.textContent = "−1";
    			t37 = text(" + S");
    			sub6 = element("sub");
    			sub6.textContent = "t";
    			sup6 = element("sup");
    			sup6.textContent = "−1";
    			t40 = space();
    			br2 = element("br");
    			t41 = text("\n  μ");
    			sub7 = element("sub");
    			sub7.textContent = "t+";
    			t43 = text(" = Σ");
    			sub8 = element("sub");
    			sub8.textContent = "t+";
    			t45 = text("Σ");
    			sub9 = element("sub");
    			sub9.textContent = "t−";
    			sup7 = element("sup");
    			sup7.textContent = "−1";
    			t48 = text("μ");
    			sub10 = element("sub");
    			sub10.textContent = "t−";
    			t50 = text(" + S");
    			sub11 = element("sub");
    			sub11.textContent = "t";
    			sup8 = element("sup");
    			sup8.textContent = "−1";
    			t53 = text("X");
    			sub12 = element("sub");
    			sub12.textContent = "t";
    			t55 = space();
    			p4 = element("p");
    			p4.textContent = "We never have to uninvert any matrix, except in solving the fourth equation. However, we can approximately solve equation 4 without any inversion by performing gradient descent on the equation:";
    			t57 = space();
    			p5 = element("p");
    			t58 = text("Σ");
    			sub13 = element("sub");
    			sub13.textContent = "t+";
    			sup9 = element("sup");
    			sup9.textContent = "−1";
    			t61 = text("μ");
    			sub14 = element("sub");
    			sub14.textContent = "t+";
    			t63 = text(" = Σ");
    			sub15 = element("sub");
    			sub15.textContent = "t−";
    			sup10 = element("sup");
    			sup10.textContent = "−1";
    			t66 = text("μ");
    			sub16 = element("sub");
    			sub16.textContent = "t−";
    			t68 = text(" + S");
    			sub17 = element("sub");
    			sub17.textContent = "t";
    			sup11 = element("sup");
    			sup11.textContent = "−1";
    			t71 = text("X");
    			sub18 = element("sub");
    			sub18.textContent = "t";
    			t73 = space();
    			p6 = element("p");
    			t74 = text("It turns out that this type of operation can be performed by the network through adding dynamic terms to the weights. Then by making a network of n");
    			sup12 = element("sup");
    			sup12.textContent = "2";
    			t76 = text(" bumps for a covariance matrix of size n by n, with scaled bumps equal to the magnitude of each covariance matrix entry, spatial locations equal to the coordinate model mean corresponding to that entry's covariance column, and several other architecture configurations, we can approximately solve the Kalman Filter equations using neural attractor dynamics in any dimension.");
    			add_location(h1, file$6, 0, 0, 0);
    			attr_dev(a, "href", "Kalman_Pres.pdf");
    			add_location(a, file$6, 1, 37, 95);
    			add_location(h2, file$6, 1, 0, 58);
    			add_location(hr, file$6, 2, 0, 150);
    			add_location(p0, file$6, 5, 0, 744);
    			add_location(em, file$6, 6, 997, 2228);
    			add_location(p1, file$6, 6, 0, 1231);
    			if (!src_url_equal(img.src, img_src_value = "./images/bump_move.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "responsive");
    			set_style(img, "border", "solid #292b2c");
    			set_style(img, "width", "65vw");
    			set_style(img, "height", "auto");
    			add_location(img, file$6, 7, 0, 2287);
    			add_location(p2, file$6, 8, 0, 2394);
    			add_location(sub0, file$6, 10, 3, 2979);
    			add_location(sub1, file$6, 10, 21, 2997);
    			add_location(br0, file$6, 11, 2, 3021);
    			add_location(sub2, file$6, 12, 3, 3029);
    			add_location(sup0, file$6, 12, 16, 3042);
    			add_location(sup1, file$6, 12, 33, 3059);
    			add_location(sub3, file$6, 12, 47, 3073);
    			add_location(sup2, file$6, 12, 64, 3090);
    			add_location(sup3, file$6, 12, 78, 3104);
    			add_location(br1, file$6, 13, 2, 3120);
    			add_location(sub4, file$6, 14, 3, 3128);
    			add_location(sup4, file$6, 14, 16, 3141);
    			add_location(sub5, file$6, 14, 33, 3158);
    			add_location(sup5, file$6, 14, 46, 3171);
    			add_location(sub6, file$6, 14, 63, 3188);
    			add_location(sup6, file$6, 14, 75, 3200);
    			add_location(br2, file$6, 15, 2, 3216);
    			add_location(sub7, file$6, 16, 3, 3224);
    			add_location(sub8, file$6, 16, 20, 3241);
    			add_location(sub9, file$6, 16, 34, 3255);
    			add_location(sup7, file$6, 16, 47, 3268);
    			add_location(sub10, file$6, 16, 61, 3282);
    			add_location(sub11, file$6, 16, 78, 3299);
    			add_location(sup8, file$6, 16, 90, 3311);
    			add_location(sub12, file$6, 16, 104, 3325);
    			set_style(p3, "text-align", "center");
    			add_location(p3, file$6, 9, 0, 2946);
    			add_location(p4, file$6, 19, 0, 3344);
    			add_location(sub13, file$6, 20, 32, 3577);
    			add_location(sup9, file$6, 20, 45, 3590);
    			add_location(sub14, file$6, 20, 59, 3604);
    			add_location(sub15, file$6, 20, 76, 3621);
    			add_location(sup10, file$6, 20, 89, 3634);
    			add_location(sub16, file$6, 20, 103, 3648);
    			add_location(sub17, file$6, 20, 120, 3665);
    			add_location(sup11, file$6, 20, 132, 3677);
    			add_location(sub18, file$6, 20, 146, 3691);
    			set_style(p5, "text-align", "center");
    			add_location(p5, file$6, 20, 0, 3545);
    			add_location(sup12, file$6, 21, 150, 3858);
    			add_location(p6, file$6, 21, 0, 3708);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t2);
    			append_dev(h2, a);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t8);
    			append_dev(p1, em);
    			append_dev(p1, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, img, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t15);
    			append_dev(p3, sub0);
    			append_dev(p3, t17);
    			append_dev(p3, sub1);
    			append_dev(p3, t19);
    			append_dev(p3, br0);
    			append_dev(p3, t20);
    			append_dev(p3, sub2);
    			append_dev(p3, sup0);
    			append_dev(p3, t23);
    			append_dev(p3, sup1);
    			append_dev(p3, t25);
    			append_dev(p3, sub3);
    			append_dev(p3, sup2);
    			append_dev(p3, t28);
    			append_dev(p3, sup3);
    			append_dev(p3, t30);
    			append_dev(p3, br1);
    			append_dev(p3, t31);
    			append_dev(p3, sub4);
    			append_dev(p3, sup4);
    			append_dev(p3, t34);
    			append_dev(p3, sub5);
    			append_dev(p3, sup5);
    			append_dev(p3, t37);
    			append_dev(p3, sub6);
    			append_dev(p3, sup6);
    			append_dev(p3, t40);
    			append_dev(p3, br2);
    			append_dev(p3, t41);
    			append_dev(p3, sub7);
    			append_dev(p3, t43);
    			append_dev(p3, sub8);
    			append_dev(p3, t45);
    			append_dev(p3, sub9);
    			append_dev(p3, sup7);
    			append_dev(p3, t48);
    			append_dev(p3, sub10);
    			append_dev(p3, t50);
    			append_dev(p3, sub11);
    			append_dev(p3, sup8);
    			append_dev(p3, t53);
    			append_dev(p3, sub12);
    			insert_dev(target, t55, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t57, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, t58);
    			append_dev(p5, sub13);
    			append_dev(p5, sup9);
    			append_dev(p5, t61);
    			append_dev(p5, sub14);
    			append_dev(p5, t63);
    			append_dev(p5, sub15);
    			append_dev(p5, sup10);
    			append_dev(p5, t66);
    			append_dev(p5, sub16);
    			append_dev(p5, t68);
    			append_dev(p5, sub17);
    			append_dev(p5, sup11);
    			append_dev(p5, t71);
    			append_dev(p5, sub18);
    			insert_dev(target, t73, anchor);
    			insert_dev(target, p6, anchor);
    			append_dev(p6, t74);
    			append_dev(p6, sup12);
    			append_dev(p6, t76);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t55);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t73);
    			if (detaching) detach_dev(p6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$3 = {};

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Kalman', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Kalman> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$3 });
    	return [];
    }

    class Kalman extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kalman",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Projects/Approximations.md generated by Svelte v3.43.0 */
    const file$5 = "src/Projects/Approximations.md";

    function create_fragment$5(ctx) {
    	let h1;
    	let t1;
    	let h2;
    	let t2;
    	let a;
    	let t4;
    	let p0;
    	let t18;
    	let p1;
    	let t20;
    	let p2;
    	let t22;
    	let img0;
    	let img0_src_value;
    	let t23;
    	let p3;
    	let t27;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Approximating Behaviors of Hodgkin-Huxley Neuron Models With Networks of Simpler Models";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text("With Calvin Zhang-Molina, Fall 2019-Spring 2021. ");
    			a = element("a");
    			a.textContent = "Poster Presentation";
    			t4 = space();
    			p0 = element("p");

    			p0.textContent = `Can small networks of simple neurons approximate more complex ones? From the field of non-biological neural networks, we know that this is the case. Deep spiking neural networks can approximate a wide range of time series functions arbitrarily well. Each of the components in a spiking neural network is made of some variation of the following leaky integrate and fire (LIF) neuron:
${`$$\\tau_k\\dfrac{dV_k}{dt} = -V_k + I_k + \\alpha(t)\\sum_{t_{ij}}w_j\\delta(t-t_{ji})$$`}
Where ${`\\(t_{ij}\\)`} gives the ith firing time of neuron j in the network, ${`\\(t_{w_j}\\)`} is the weight of the firing strength of neuron j on neuron k, and ${`\\(\\alpha(t)\\)`} gives the decay function on the firing, ${`\\(I_k\\)`} is the steady state voltage, and ${`\\(\\tau_k\\)`} is the time constant of the neuron. A LIF neuron "fires" when it's voltage reaches some threshold value. At this point, it's voltage resets to 0. This equation is extremely simple in comparison to more biologically plausible Hodgkin-Huxley type model neurons which consits of four coupled nonlinear differential equations. Because of this, an LIF neuron cannot display the same amount of rich behavior that biological and Hodgkin-Huxley neurons can. In fact, an LIF neuron has a very similar equation to how a single ion channel neuron would behave, of which a Hodgkin-Huxley type has many. However, if we pass in a set of time series voltage inputs into a neuron and then retrieve the spike times of that neuron, we can treat a neuron as a nonlinear function from one time series to another. This behavior can be approximated by a spiking neural network of some size. Now, we might ask how small can an LIF network be and still approximate some property of a biological neuron.`;

    			t18 = space();
    			p1 = element("p");
    			p1.textContent = "In this project, we investigated the minimum number of LIF neurons needed to display the property of Post-Inhibitory Rebound (PIR). PIR is an effect in biological neurons where after recieving a strong inhibitory pulse, a neuron may release a spike. This is due to the fact that the currents of exitatory channels in a neuron are faster than inhibitory channels, meaning that closing both channel types with a low voltage will lead to the exitatory currents recovering faster and potentially leading to a runaway spike before the inhibitory currents can react. This is in sharp contrast to how a neuron typically fires by having its exitatory currents activated by a strong, positive current. We defined a PIR-like effect to be a temporary increase in the firing rate of a neuron following a strong inhibitory current. We were able to show that while this effect is impossible to replicate in a single LIF neuron, we can get it in a network of 2 neurons. In addition, we were able to derive a sufficient condition for obtaining this effect.";
    			t20 = space();
    			p2 = element("p");
    			p2.textContent = "The part of this project that I found to be the most interesting was how complicated the dynamics a network of two coupled integrate and fire neurons could produce. For example we were able to analytically capture a set of recursive equations for the switching times of the network (switching from when one neuron would supress the voltage of the other to the opposite), and they displayed very interesting limit cycles.";
    			t22 = space();
    			img0 = element("img");
    			t23 = space();
    			p3 = element("p");
    			p3.textContent = `I also really enjoyed how much geometry was present in the problem. There was a point at which I realized that we could model a set of n linear integrate and fire neurons as sort of bouncing around inside a box spanned by ${`\\(\(-\\infty,1)^n\\)`}while being linearly attracted to some point outside of the box. Here is a cool demonstration of this box visualization, where the limit cycles of two neurons evolve as the coupling strength between them is strengthened.`;
    			t27 = space();
    			img1 = element("img");
    			add_location(h1, file$5, 0, 0, 0);
    			attr_dev(a, "href", "PIR_Pres.pdf");
    			add_location(a, file$5, 1, 53, 150);
    			add_location(h2, file$5, 1, 0, 97);
    			add_location(p0, file$5, 2, 0, 202);
    			add_location(p1, file$5, 5, 0, 1969);
    			add_location(p2, file$5, 6, 0, 3017);
    			if (!src_url_equal(img0.src, img0_src_value = "./images/limitCycle.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "responsive");
    			set_style(img0, "border", "solid #292b2c");
    			set_style(img0, "width", "65vw");
    			set_style(img0, "height", "auto");
    			add_location(img0, file$5, 7, 0, 3445);
    			add_location(p3, file$5, 8, 0, 3554);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/limitSet.gif")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "responsive");
    			set_style(img1, "border", "solid #292b2c");
    			set_style(img1, "width", "65vw");
    			set_style(img1, "height", "auto");
    			add_location(img1, file$5, 9, 0, 4029);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t2);
    			append_dev(h2, a);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, img0, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, img1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(img0);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(img1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$2 = {};

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Approximations', slots, []);

    	onMount(() => {
    		let script = document.createElement('script');
    		script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    		document.head.append(script);

    		script.onload = () => {
    			MathJax = {
    				tex: {
    					inlineMath: [['$', '$'], ['\\(', '\\)']],
    					extensions: ["AMSmath.js", "AMSsymbols.js"]
    				},
    				svg: { fontCache: 'global' }
    			};
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Approximations> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$2, onMount });
    	return [];
    }

    class Approximations extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Approximations",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Projects/Monkey.md generated by Svelte v3.43.0 */

    const file$4 = "src/Projects/Monkey.md";

    function create_fragment$4(ctx) {
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let p0;
    	let t5;
    	let p1;
    	let t7;
    	let p2;
    	let t9;
    	let p3;
    	let t11;
    	let p4;
    	let t13;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Extracting Information from Electrode and Neural Spike Recordings from Macaque Monkeys";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "With Kevin Lin and Alexa Aucoin, Summer 2021";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "How do we determine the type of stimulus administered to a monkey given only access to their neural recordings? How do we extract the patterns associated with each stimulus type? How do we choose the most important electrodes and neurons in producing these patterns? All of these were questions we asked and attempted to answer in this summer project.";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "In the dataset we worked with, the monkeys were given several types of stimulus while deep brain electrodes were recording from two seperate brain regions (denoted by A and B due to the data being not yet published). While brain region A responded very strongly to the different types of stimulus, the other did not appear to. What we attempted to do was connect the activity of the two brain regions, and extract a potentially complex signal from region B. We obtained a preliminary finding that the two brain regions may be encoding nearly independant information. However, we werent able to entirely flesh it out by the time we wrapped up the project.";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "In addition, we investigated the performance of different feature selection algorithms on the electrode and neuron recordings over both linear Support Vector Machines and Nearest Centroid with the Mahalnobis Distance classifiers. One method we found particular interesting was the commonly used leverage based feature selector and its performance in comparison to Principal Component Analysis (PCA). The idea of leverage stems from statistical regression techniques. A high leverage point in regression is a point that has a high degree of distance away from other points in the independant variables. Because of this, it has the ability to influence, or pull, the regression line towards itself. Leverage in the context of PCA is very similar except that instead of a row of data pulling a regression line, a data column pulls the first k left eigenvectors of the dataset towards itself. A leverage based feature selector calculates the leverage of each data column, and then selects the columns with the highest leverage. Presumably, these vectors then construct most of the top k eigenvectors and as such they should capture the most important data columns. In our datasets however, we noticed a discrepency in how well the leverage based feature selector performed in comparison to the top k left eigenvectors on linear SVMs. The performance didn't seem to match between them, with the eigenvectors dominating the leverage vectors by a large margin. So, we dug into this analytically, and built a new algorithm that, while more computationally expensive than leverage, actually constructs a subspace that is nearer to the left k eigenvectors and performs more similarly.";
    			t9 = space();
    			p3 = element("p");
    			p3.textContent = "In addition, we found that sometimes an extremely simple feature selector can outperform anything fancy. Over a small label class size, we selected data vectors that had the highest difference in pairwise means between the other labels. This basic feature selector outperformed both mutual information and PCA based feature selectors.";
    			t11 = space();
    			p4 = element("p");
    			p4.textContent = "In this figure we can see both of these results, the algorithm we built (here called subspace) oscillates in performance around PCA, and the pairwise mean seperation algorithm (mean) solidly outperforms the rest.";
    			t13 = space();
    			img = element("img");
    			add_location(h1, file$4, 0, 0, 0);
    			add_location(h2, file$4, 1, 0, 96);
    			add_location(p0, file$4, 2, 0, 150);
    			add_location(p1, file$4, 3, 0, 510);
    			add_location(p2, file$4, 4, 0, 1173);
    			add_location(p3, file$4, 5, 0, 2860);
    			add_location(p4, file$4, 6, 0, 3203);
    			if (!src_url_equal(img.src, img_src_value = "./images/Monkeys.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "responsive");
    			set_style(img, "border", "solid #292b2c");
    			set_style(img, "width", "65vw");
    			set_style(img, "height", "auto");
    			add_location(img, file$4, 7, 0, 3424);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$1 = {};

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Monkey', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Monkey> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$1 });
    	return [];
    }

    class Monkey extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Monkey",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Projects/PsychoSite.md generated by Svelte v3.43.0 */

    const file$3 = "src/Projects/PsychoSite.md";

    function create_fragment$3(ctx) {
    	let h1;
    	let t1;
    	let h20;
    	let t2;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let a2;
    	let t8;
    	let p0;
    	let t10;
    	let p1;
    	let t12;
    	let p2;
    	let t14;
    	let ol;
    	let li0;
    	let t16;
    	let li1;
    	let t18;
    	let li2;
    	let t20;
    	let li3;
    	let t22;
    	let li4;
    	let t24;
    	let li5;
    	let t25;
    	let strong;
    	let t27;
    	let t28;
    	let h21;
    	let t30;
    	let p3;
    	let t31;
    	let a3;
    	let t33;
    	let p4;
    	let t35;
    	let p5;
    	let t36;
    	let a4;
    	let t38;
    	let a5;
    	let t40;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Building A Flexible Online Experiment Platform for Psychology Researchers";
    			t1 = space();
    			h20 = element("h2");
    			t2 = text("With Robert Wilson, Fall 2019 - Present. ");
    			a0 = element("a");
    			a0.textContent = "Exius";
    			t4 = text(",");
    			a1 = element("a");
    			a1.textContent = "Teaching Task";
    			t6 = text(",");
    			a2 = element("a");
    			a2.textContent = "Horizon Task";
    			t8 = space();
    			p0 = element("p");
    			p0.textContent = "As the onset of the Covid-19 pandemic began back in the spring of 2019, the NRD psychology lab I was working with was suddenly thrust into a difficult position. We no longer had the ability to run subjects in the lab. In order to keep the lab rolling, we decided to transition some of our research online. However, we were met with several barriers with existing software for running human subjects through online pools. The first was the large cost associated with running subjects, especially since in the past we had dealt with very large subject pools. We also ran into the issue of platforms \"locking you into\" their service. For example, Pavlovia, while being a very well put together platform requires you to use their servers to store user data as well as use their development platform Psychopy/js to build your experiment. So, we sought to find a way to run human subjects for near nothing using existing services already used by our university with the flexability of using any html/javascript script for the experiment. This evolved over time to produce the current build, PsychoSite.";
    			t10 = space();
    			p1 = element("p");
    			p1.textContent = "By early 2020, I had a beta version of PsychoSite for the NRD lab running, and we successfully collected data from several online experiments over several months with a net cost of 11$ to the lab which was only from purchasing a domain name. We were able to accomplish this by using the free tier amazon web services EC2 and DynamoDB,a free static website on github, and the lab's box account for storage. It was at this point that I realized that we could turn PsychoSite into a viable product for other labs besides ours. So, I began an entire redesign of the product.";
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "The goal of PsychoSite now is to accomplish several things:";
    			t14 = space();
    			ol = element("ol");
    			li0 = element("li");
    			li0.textContent = "Run experiments built with any framework as long as it outputs static html/javascript.";
    			t16 = space();
    			li1 = element("li");
    			li1.textContent = "Share researcher's code through open source repositories on github and promote both researchers sharing final experiment as well as their code used to generate it.";
    			t18 = space();
    			li2 = element("li");
    			li2.textContent = "Archive experiments so that researchers can easily replicate and rerun them.";
    			t20 = space();
    			li3 = element("li");
    			li3.textContent = "Be easy to use and intuitive with a nice GUI, but also have the ability for users to customize it for their use cases.";
    			t22 = space();
    			li4 = element("li");
    			li4.textContent = "Be platform independant and easy to launch so researchers can use the resources already available to them.";
    			t24 = space();
    			li5 = element("li");
    			t25 = text("Be ");
    			strong = element("strong");
    			strong.textContent = "FREE";
    			t27 = text(" or near to it!");
    			t28 = space();
    			h21 = element("h2");
    			h21.textContent = "The setup:";
    			t30 = space();
    			p3 = element("p");
    			t31 = text("The backend, Exius, has been redesigned and rebuilt from the ground up. It is entirely dockerized with an NGINX proxy and auto-renewing SSL certificates. Exius is written in Node.js, and provides an interface for creating filtered endpoints to a box account that can limit the size, content, number of items, and write location of incoming items depending on the experiment. In addition, users can specify passwords for each experiment that need to be present in order to upload. This allows for experiments to be static, yet have the data being sent out by them to box be as secure as possible without doing a proper user verification process for every user that attempts to perform an upload. Researchers use their github accounts to do verification in order to create and modify endpoints created by their lab.\nAs of now, Exius is in alpha and can be found at ");
    			a3 = element("a");
    			a3.textContent = "Exius Github";
    			t33 = space();
    			p4 = element("p");
    			p4.textContent = "The new frontend for PsychoSite consists of an electron app that communicates with Exius to build experiments, locally use git on the researcher's computer, and provide users with a GUI. In addition, it allows users to build experiment flows and information passing between experiment components without needing to know how to use query strings. Finally, it lets them export their data from their experiment by importing a js module and calling a single function. Users can use the app to automatically create, version track, and periodically update an experiment on github pages. In addition they can launch a free backend on Heroku with the click of a button. This theoretically allows users to have a free PsychoSite using a free tier 5gb box storage, a free backend, and free website hosting through their github organization. Currently, the app is in heavy development, and is expected to release in alpha sometime in January 2021.";
    			t35 = space();
    			p5 = element("p");
    			t36 = text("Several experiments for the lab that I built that have been run on PsychoSite are the ");
    			a4 = element("a");
    			a4.textContent = "Teaching Task";
    			t38 = text(" and the ");
    			a5 = element("a");
    			a5.textContent = "Horizon Task";
    			t40 = text(".");
    			add_location(h1, file$3, 0, 0, 0);
    			attr_dev(a0, "href", "https://github.com/LaneLewis/Exius");
    			add_location(a0, file$3, 1, 45, 128);
    			attr_dev(a1, "href", "https://github.com/LaneLewis/TeachingTask");
    			add_location(a1, file$3, 1, 100, 183);
    			attr_dev(a2, "href", "https://github.com/LaneLewis/HorizonTask");
    			add_location(a2, file$3, 1, 170, 253);
    			add_location(h20, file$3, 1, 0, 83);
    			add_location(p0, file$3, 2, 0, 326);
    			add_location(p1, file$3, 3, 0, 1440);
    			add_location(p2, file$3, 4, 0, 2023);
    			add_location(li0, file$3, 6, 0, 2095);
    			add_location(li1, file$3, 7, 0, 2193);
    			add_location(li2, file$3, 8, 0, 2370);
    			add_location(li3, file$3, 9, 0, 2456);
    			add_location(li4, file$3, 10, 0, 2585);
    			add_location(strong, file$3, 11, 7, 2708);
    			add_location(li5, file$3, 11, 0, 2701);
    			add_location(ol, file$3, 5, 0, 2090);
    			add_location(h21, file$3, 13, 0, 2756);
    			attr_dev(a3, "href", "https://github.com/LaneLewis/Exius");
    			add_location(a3, file$3, 15, 49, 3642);
    			add_location(p3, file$3, 14, 0, 2776);
    			add_location(p4, file$3, 16, 0, 3708);
    			attr_dev(a4, "href", "https://github.com/LaneLewis/TeachingTask");
    			add_location(a4, file$3, 17, 89, 4745);
    			attr_dev(a5, "href", "https://github.com/LaneLewis/HorizonTask");
    			add_location(a5, file$3, 17, 167, 4823);
    			add_location(p5, file$3, 17, 0, 4656);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h20, anchor);
    			append_dev(h20, t2);
    			append_dev(h20, a0);
    			append_dev(h20, t4);
    			append_dev(h20, a1);
    			append_dev(h20, t6);
    			append_dev(h20, a2);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, ol, anchor);
    			append_dev(ol, li0);
    			append_dev(ol, t16);
    			append_dev(ol, li1);
    			append_dev(ol, t18);
    			append_dev(ol, li2);
    			append_dev(ol, t20);
    			append_dev(ol, li3);
    			append_dev(ol, t22);
    			append_dev(ol, li4);
    			append_dev(ol, t24);
    			append_dev(ol, li5);
    			append_dev(li5, t25);
    			append_dev(li5, strong);
    			append_dev(li5, t27);
    			insert_dev(target, t28, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t30, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t31);
    			append_dev(p3, a3);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, t36);
    			append_dev(p5, a4);
    			append_dev(p5, t38);
    			append_dev(p5, a5);
    			append_dev(p5, t40);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(ol);
    			if (detaching) detach_dev(t28);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t30);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(p5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META = {};

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PsychoSite', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PsychoSite> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META });
    	return [];
    }

    class PsychoSite extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PsychoSite",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Projects.svelte generated by Svelte v3.43.0 */

    const { window: window_1$1 } = globals;
    const file$2 = "src/Projects.svelte";

    // (89:0) {:else}
    function create_else_block$1(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t1;
    	let button;
    	let h3;
    	let t3;
    	let mounted;
    	let dispose;
    	let if_block = /*dropdownOn*/ ctx[2] && create_if_block_5(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Select Project";
    			t1 = space();
    			button = element("button");
    			h3 = element("h3");
    			h3.textContent = "...";
    			t3 = space();
    			if (if_block) if_block.c();
    			set_style(p, "left", "30px");
    			set_style(p, "position", "absolute");
    			add_location(p, file$2, 91, 3, 2377);
    			set_style(div0, "text-align", "left");
    			set_style(div0, "color", "#fff8e7");
    			set_style(div0, "top", "-10px");
    			set_style(div0, "position", "relative");
    			set_style(div0, "width", "120px");
    			add_location(div0, file$2, 90, 2, 2290);
    			set_style(h3, "color", "gold");
    			set_style(h3, "top", "-40px");
    			set_style(h3, "position", "relative");
    			add_location(h3, file$2, 94, 3, 2597);
    			set_style(button, "top", "5px");
    			set_style(button, "left", "150px");
    			set_style(button, "position", "absolute");
    			set_style(button, "font-size", "20px");
    			set_style(button, "height", "10px");
    			set_style(button, "background-color", "#292b2c");
    			attr_dev(button, "class", "svelte-1rr8n5");
    			add_location(button, file$2, 93, 2, 2446);
    			set_style(div1, "margin", "0");
    			set_style(div1, "width", "200px");
    			set_style(div1, "height", "30px");
    			set_style(div1, "top", "90px");
    			set_style(div1, "border-radius", "10px");
    			set_style(div1, "left", "calc(50vw - 100px)");
    			set_style(div1, "background-color", "#292b2c");
    			set_style(div1, "position", "relative");
    			add_location(div1, file$2, 89, 1, 2146);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(button, h3);
    			append_dev(div1, t3);
    			if (if_block) if_block.m(div1, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*dropdownOn*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(89:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:0) {#if windowSize > 600}
    function create_if_block_4(ctx) {
    	let div;
    	let button0;
    	let t0;
    	let button0_style_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_style_value;
    	let t3;
    	let button2;
    	let t4;
    	let button2_style_value;
    	let t5;
    	let button3;
    	let t6;
    	let button3_style_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("Monkey Brain Analysis");
    			t1 = space();
    			button1 = element("button");
    			t2 = text("Neural Kalman Filters");
    			t3 = space();
    			button2 = element("button");
    			t4 = text("Neuron Approximations");
    			t5 = space();
    			button3 = element("button");
    			t6 = text("PsychoSite");
    			attr_dev(button0, "class", "location svelte-1rr8n5");

    			attr_dev(button0, "style", button0_style_value = /*current*/ ctx[0] == "monkey"
    			? "text-decoration:underline"
    			: "");

    			add_location(button0, file$2, 75, 2, 1454);
    			attr_dev(button1, "class", "location svelte-1rr8n5");

    			attr_dev(button1, "style", button1_style_value = /*current*/ ctx[0] == "kalman"
    			? "text-decoration:underline"
    			: "");

    			add_location(button1, file$2, 78, 2, 1620);
    			attr_dev(button2, "class", "location svelte-1rr8n5");

    			attr_dev(button2, "style", button2_style_value = /*current*/ ctx[0] == "approximations"
    			? "text-decoration:underline"
    			: "");

    			add_location(button2, file$2, 81, 2, 1786);
    			attr_dev(button3, "class", "location svelte-1rr8n5");

    			attr_dev(button3, "style", button3_style_value = /*current*/ ctx[0] == "psychosite"
    			? "text-decoration:underline"
    			: "");

    			add_location(button3, file$2, 84, 2, 1968);
    			attr_dev(div, "class", "selections svelte-1rr8n5");
    			add_location(div, file$2, 74, 1, 1426);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, t2);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(button2, t4);
    			append_dev(div, t5);
    			append_dev(div, button3);
    			append_dev(button3, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[7], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*current*/ 1 && button0_style_value !== (button0_style_value = /*current*/ ctx[0] == "monkey"
    			? "text-decoration:underline"
    			: "")) {
    				attr_dev(button0, "style", button0_style_value);
    			}

    			if (dirty & /*current*/ 1 && button1_style_value !== (button1_style_value = /*current*/ ctx[0] == "kalman"
    			? "text-decoration:underline"
    			: "")) {
    				attr_dev(button1, "style", button1_style_value);
    			}

    			if (dirty & /*current*/ 1 && button2_style_value !== (button2_style_value = /*current*/ ctx[0] == "approximations"
    			? "text-decoration:underline"
    			: "")) {
    				attr_dev(button2, "style", button2_style_value);
    			}

    			if (dirty & /*current*/ 1 && button3_style_value !== (button3_style_value = /*current*/ ctx[0] == "psychosite"
    			? "text-decoration:underline"
    			: "")) {
    				attr_dev(button3, "style", button3_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(74:0) {#if windowSize > 600}",
    		ctx
    	});

    	return block;
    }

    // (97:2) {#if dropdownOn}
    function create_if_block_5(ctx) {
    	let div;
    	let button0;
    	let t0;
    	let button0_style_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_style_value;
    	let t3;
    	let button2;
    	let t4;
    	let button2_style_value;
    	let t5;
    	let button3;
    	let t6;
    	let button3_style_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("Monkey Brain Analysis");
    			t1 = space();
    			button1 = element("button");
    			t2 = text("Neural Kalman Filters");
    			t3 = space();
    			button2 = element("button");
    			t4 = text("Neuron Approximations");
    			t5 = space();
    			button3 = element("button");
    			t6 = text("PsychoSite");
    			attr_dev(button0, "class", "project-drop svelte-1rr8n5");

    			attr_dev(button0, "style", button0_style_value = /*current*/ ctx[0] == "monkey"
    			? "text-decoration:underline"
    			: "");

    			add_location(button0, file$2, 98, 5, 2781);
    			attr_dev(button1, "class", "project-drop svelte-1rr8n5");

    			attr_dev(button1, "style", button1_style_value = "top:-3px;" + (/*current*/ ctx[0] == "kalman"
    			? "text-decoration:underline"
    			: ""));

    			add_location(button1, file$2, 101, 5, 2962);
    			attr_dev(button2, "class", "project-drop svelte-1rr8n5");

    			attr_dev(button2, "style", button2_style_value = "top:-6px;" + (/*current*/ ctx[0] == "approximations"
    			? "text-decoration:underline"
    			: ""));

    			add_location(button2, file$2, 104, 5, 3150);
    			attr_dev(button3, "class", "project-drop svelte-1rr8n5");

    			attr_dev(button3, "style", button3_style_value = "left:-7px;top:-9px;" + (/*current*/ ctx[0] == "psychosite"
    			? "text-decoration:underline"
    			: ""));

    			add_location(button3, file$2, 107, 5, 3354);
    			set_style(div, "text-align", "right");
    			set_style(div, "color", "#fff8e7");
    			set_style(div, "top", "30px");
    			set_style(div, "position", "absolute");
    			set_style(div, "z-index", "1");
    			add_location(div, file$2, 97, 3, 2691);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, t2);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(button2, t4);
    			append_dev(div, t5);
    			append_dev(div, button3);
    			append_dev(button3, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_5*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*click_handler_6*/ ctx[11], false, false, false),
    					listen_dev(button2, "click", /*click_handler_7*/ ctx[12], false, false, false),
    					listen_dev(button3, "click", /*click_handler_8*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*current*/ 1 && button0_style_value !== (button0_style_value = /*current*/ ctx[0] == "monkey"
    			? "text-decoration:underline"
    			: "")) {
    				attr_dev(button0, "style", button0_style_value);
    			}

    			if (dirty & /*current*/ 1 && button1_style_value !== (button1_style_value = "top:-3px;" + (/*current*/ ctx[0] == "kalman"
    			? "text-decoration:underline"
    			: ""))) {
    				attr_dev(button1, "style", button1_style_value);
    			}

    			if (dirty & /*current*/ 1 && button2_style_value !== (button2_style_value = "top:-6px;" + (/*current*/ ctx[0] == "approximations"
    			? "text-decoration:underline"
    			: ""))) {
    				attr_dev(button2, "style", button2_style_value);
    			}

    			if (dirty & /*current*/ 1 && button3_style_value !== (button3_style_value = "left:-7px;top:-9px;" + (/*current*/ ctx[0] == "psychosite"
    			? "text-decoration:underline"
    			: ""))) {
    				attr_dev(button3, "style", button3_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(97:2) {#if dropdownOn}",
    		ctx
    	});

    	return block;
    }

    // (116:0) {#if current === "kalman"}
    function create_if_block_3$1(ctx) {
    	let div1;
    	let div0;
    	let kalman;
    	let current;
    	kalman = new Kalman({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(kalman.$$.fragment);
    			set_style(div0, "position", "relative");
    			set_style(div0, "border", ".5vw solid #292b2c");
    			set_style(div0, "border-radius", "1vw");
    			set_style(div0, "padding", "2vw");
    			attr_dev(div0, "class", "svelte-1rr8n5");
    			add_location(div0, file$2, 117, 2, 3661);
    			attr_dev(div1, "class", "blog-container kalman svelte-1rr8n5");
    			set_style(div1, "top", "100px");
    			add_location(div1, file$2, 116, 1, 3605);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(kalman, div0, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(kalman.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(kalman.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(kalman);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(116:0) {#if current === \\\"kalman\\\"}",
    		ctx
    	});

    	return block;
    }

    // (123:0) {#if current === "monkey"}
    function create_if_block_2$1(ctx) {
    	let div1;
    	let div0;
    	let monkey;
    	let current;
    	monkey = new Monkey({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(monkey.$$.fragment);
    			set_style(div0, "position", "relative");
    			set_style(div0, "border", ".5vw solid #292b2c");
    			set_style(div0, "border-radius", "1vw");
    			set_style(div0, "padding", "2vw");
    			attr_dev(div0, "class", "svelte-1rr8n5");
    			add_location(div0, file$2, 124, 1, 3868);
    			attr_dev(div1, "class", "blog-container svelte-1rr8n5");
    			set_style(div1, "top", "100px");
    			add_location(div1, file$2, 123, 0, 3822);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(monkey, div0, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(monkey.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(monkey.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(monkey);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(123:0) {#if current === \\\"monkey\\\"}",
    		ctx
    	});

    	return block;
    }

    // (130:0) {#if current === "approximations"}
    function create_if_block_1$1(ctx) {
    	let div1;
    	let div0;
    	let approximations;
    	let current;
    	approximations = new Approximations({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(approximations.$$.fragment);
    			set_style(div0, "position", "relative");
    			set_style(div0, "border", ".5vw solid #292b2c");
    			set_style(div0, "border-radius", "1vw");
    			set_style(div0, "padding", "2vw");
    			attr_dev(div0, "class", "svelte-1rr8n5");
    			add_location(div0, file$2, 131, 2, 4099);
    			attr_dev(div1, "class", "blog-container approximations svelte-1rr8n5");
    			set_style(div1, "top", "100px");
    			add_location(div1, file$2, 130, 1, 4035);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(approximations, div0, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(approximations.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(approximations.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(approximations);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(130:0) {#if current === \\\"approximations\\\"}",
    		ctx
    	});

    	return block;
    }

    // (137:0) {#if current === "psychosite"}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let psychosite;
    	let current;
    	psychosite = new PsychoSite({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(psychosite.$$.fragment);
    			set_style(div0, "position", "relative");
    			set_style(div0, "border", ".5vw solid #292b2c");
    			set_style(div0, "border-radius", "1vw");
    			set_style(div0, "padding", "2vw");
    			attr_dev(div0, "class", "svelte-1rr8n5");
    			add_location(div0, file$2, 138, 2, 4328);
    			attr_dev(div1, "class", "blog-container svelte-1rr8n5");
    			set_style(div1, "top", "100px");
    			add_location(div1, file$2, 137, 1, 4281);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(psychosite, div0, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(psychosite.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(psychosite.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(psychosite);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(137:0) {#if current === \\\"psychosite\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let if_block4_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*windowSize*/ ctx[1] > 600) return create_if_block_4;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*current*/ ctx[0] === "kalman" && create_if_block_3$1(ctx);
    	let if_block2 = /*current*/ ctx[0] === "monkey" && create_if_block_2$1(ctx);
    	let if_block3 = /*current*/ ctx[0] === "approximations" && create_if_block_1$1(ctx);
    	let if_block4 = /*current*/ ctx[0] === "psychosite" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			if_block4_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, if_block4_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window_1$1, "resize", /*newSize*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			}

    			if (/*current*/ ctx[0] === "kalman") {
    				if (if_block1) {
    					if (dirty & /*current*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*current*/ ctx[0] === "monkey") {
    				if (if_block2) {
    					if (dirty & /*current*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t2.parentNode, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*current*/ ctx[0] === "approximations") {
    				if (if_block3) {
    					if (dirty & /*current*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t3.parentNode, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*current*/ ctx[0] === "psychosite") {
    				if (if_block4) {
    					if (dirty & /*current*/ 1) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(if_block4_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Projects', slots, []);
    	let current = "monkey";

    	function changeCurrent(newCurrent) {
    		$$invalidate(0, current = newCurrent);
    	}

    	let windowSize = window.innerWidth;

    	function newSize() {
    		$$invalidate(1, windowSize = window.innerWidth);

    		if (windowSize > 600) {
    			$$invalidate(2, dropdownOn = false);
    		}
    	}

    	let dropdownOn = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => changeCurrent("monkey");
    	const click_handler_1 = () => changeCurrent("kalman");
    	const click_handler_2 = () => changeCurrent("approximations");
    	const click_handler_3 = () => changeCurrent("psychosite");

    	const click_handler_4 = () => {
    		$$invalidate(2, dropdownOn = !dropdownOn);
    	};

    	const click_handler_5 = () => changeCurrent("monkey");
    	const click_handler_6 = () => changeCurrent("kalman");
    	const click_handler_7 = () => changeCurrent("approximations");
    	const click_handler_8 = () => changeCurrent("psychosite");

    	$$self.$capture_state = () => ({
    		Kalman,
    		Approximations,
    		Monkey,
    		PsychoSite,
    		current,
    		changeCurrent,
    		windowSize,
    		newSize,
    		dropdownOn
    	});

    	$$self.$inject_state = $$props => {
    		if ('current' in $$props) $$invalidate(0, current = $$props.current);
    		if ('windowSize' in $$props) $$invalidate(1, windowSize = $$props.windowSize);
    		if ('dropdownOn' in $$props) $$invalidate(2, dropdownOn = $$props.dropdownOn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		current,
    		windowSize,
    		dropdownOn,
    		changeCurrent,
    		newSize,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8
    	];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Home.svelte generated by Svelte v3.43.0 */

    const file$1 = "src/Home.svelte";

    function create_fragment$1(ctx) {
    	let div13;
    	let div0;
    	let h10;
    	let t1;
    	let div1;
    	let img;
    	let img_src_value;
    	let t2;
    	let div2;
    	let h11;
    	let t4;
    	let div12;
    	let div4;
    	let h12;
    	let t6;
    	let div3;
    	let t8;
    	let div11;
    	let h13;
    	let t10;
    	let div10;
    	let h30;
    	let t12;
    	let div8;
    	let div5;
    	let a0;
    	let t14;
    	let div6;
    	let a1;
    	let t16;
    	let div7;
    	let a2;
    	let t18;
    	let h31;
    	let t20;
    	let div9;
    	let t21;
    	let br;
    	let t22;
    	let t23;
    	let div14;

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Lane Lewis";
    			t1 = space();
    			div1 = element("div");
    			img = element("img");
    			t2 = space();
    			div2 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Machine Learning, Neuroscience, and Mathematics Enthusiast";
    			t4 = space();
    			div12 = element("div");
    			div4 = element("div");
    			h12 = element("h1");
    			h12.textContent = "About";
    			t6 = space();
    			div3 = element("div");
    			div3.textContent = "My interests lie in using neuroscience to inform the development of intelligent algorithms,\n                and using intelligent algorithms to accelerate neuroscience research. I also have a general\n                interest in machine learning algorithm development and building software\n                that can automate, predict, and fluidly conform to human behaviors. A jack of all trades,\n                I have a background in mathematical analysis and proofs, both web and scientific computing,\n                machine learning, and neuroscience.";
    			t8 = space();
    			div11 = element("div");
    			h13 = element("h1");
    			h13.textContent = "Information";
    			t10 = space();
    			div10 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Documents";
    			t12 = space();
    			div8 = element("div");
    			div5 = element("div");
    			a0 = element("a");
    			a0.textContent = "Resume";
    			t14 = space();
    			div6 = element("div");
    			a1 = element("a");
    			a1.textContent = "CV";
    			t16 = space();
    			div7 = element("div");
    			a2 = element("a");
    			a2.textContent = "Transcript";
    			t18 = space();
    			h31 = element("h3");
    			h31.textContent = "Contact";
    			t20 = space();
    			div9 = element("div");
    			t21 = text("Email: lanerobertlewis@email.arizona.edu\n                    ");
    			br = element("br");
    			t22 = text("\n                    Phone: (406) 830-4470");
    			t23 = space();
    			div14 = element("div");
    			attr_dev(h10, "class", "top-text svelte-4svkvp");
    			add_location(h10, file$1, 42, 8, 1119);
    			set_style(div0, "text-align", "center");
    			set_style(div0, "position", "relative");
    			set_style(div0, "margin", "auto");
    			set_style(div0, "width", "100vw");
    			attr_dev(div0, "class", "svelte-4svkvp");
    			add_location(div0, file$1, 41, 4, 1036);
    			if (!src_url_equal(img.src, img_src_value = "./images/Portrait.jpeg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "responsive");
    			attr_dev(img, "class", "picture svelte-4svkvp");
    			add_location(img, file$1, 47, 8, 1228);
    			attr_dev(div1, "class", "picture-surround svelte-4svkvp");
    			add_location(div1, file$1, 46, 4, 1191);
    			attr_dev(h11, "class", "tag-text svelte-4svkvp");
    			add_location(h11, file$1, 50, 8, 1353);
    			set_style(div2, "position", "relative");
    			attr_dev(div2, "class", "svelte-4svkvp");
    			add_location(div2, file$1, 49, 4, 1312);
    			set_style(h12, "text-align", "center");
    			set_style(h12, "border-bottom", "solid #292b2c");
    			add_location(h12, file$1, 56, 12, 1612);
    			attr_dev(div3, "class", "bottom-container");
    			set_style(div3, "width", "40vw");
    			set_style(div3, "position", "relative");
    			set_style(div3, "left", "2vw");
    			add_location(div3, file$1, 57, 12, 1694);
    			set_style(div4, "width", "43vw");
    			add_location(div4, file$1, 55, 8, 1574);
    			set_style(h13, "text-align", "center");
    			set_style(h13, "border-bottom", "solid #292b2c");
    			add_location(h13, file$1, 67, 12, 2422);
    			set_style(h30, "text-align", "center");
    			set_style(h30, "height", "5px");
    			add_location(h30, file$1, 69, 16, 2604);
    			attr_dev(a0, "href", "./documents/resume.pdf");
    			add_location(a0, file$1, 74, 24, 2882);
    			set_style(div5, "width", "22vw");
    			set_style(div5, "text-align", "center");
    			add_location(div5, file$1, 73, 20, 2815);
    			attr_dev(a1, "href", "./documents/CV.pdf");
    			add_location(a1, file$1, 77, 24, 3039);
    			set_style(div6, "width", "22vw");
    			set_style(div6, "text-align", "center");
    			add_location(div6, file$1, 76, 20, 2972);
    			attr_dev(a2, "href", "./documents/Transcript.pdf");
    			add_location(a2, file$1, 80, 24, 3187);
    			set_style(div7, "width", "22vw");
    			set_style(div7, "text-align", "center");
    			add_location(div7, file$1, 79, 20, 3120);
    			set_style(div8, "display", "flex");
    			set_style(div8, "flex-direction", "row");
    			set_style(div8, "justify-content", "center");
    			set_style(div8, "height", "10px");
    			add_location(div8, file$1, 72, 16, 2714);
    			set_style(h31, "text-align", "center");
    			set_style(h31, "height", "5px");
    			add_location(h31, file$1, 83, 16, 3303);
    			add_location(br, file$1, 88, 20, 3535);
    			set_style(div9, "text-align", "center");
    			add_location(div9, file$1, 86, 16, 3422);
    			attr_dev(div10, "class", "bottom-container");
    			set_style(div10, "width", "40vw");
    			set_style(div10, "position", "relative");
    			set_style(div10, "left", "1.5vw");
    			add_location(div10, file$1, 68, 12, 2511);
    			set_style(div11, "width", "43vw");
    			add_location(div11, file$1, 66, 8, 2383);
    			set_style(div12, "display", "flex");
    			set_style(div12, "flex-direction", "row");
    			set_style(div12, "justify-content", "space-evenly");
    			set_style(div12, "position", "relative");
    			attr_dev(div12, "class", "svelte-4svkvp");
    			add_location(div12, file$1, 54, 4, 1473);
    			attr_dev(div13, "class", "home-container svelte-4svkvp");
    			set_style(div13, "position", "relative");
    			set_style(div13, "top", "100px");
    			set_style(div13, "left", "0");
    			add_location(div13, file$1, 40, 0, 960);
    			set_style(div14, "position", "relative");
    			set_style(div14, "height", "100px");
    			add_location(div14, file$1, 95, 0, 3657);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div0);
    			append_dev(div0, h10);
    			append_dev(div13, t1);
    			append_dev(div13, div1);
    			append_dev(div1, img);
    			append_dev(div13, t2);
    			append_dev(div13, div2);
    			append_dev(div2, h11);
    			append_dev(div13, t4);
    			append_dev(div13, div12);
    			append_dev(div12, div4);
    			append_dev(div4, h12);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div12, t8);
    			append_dev(div12, div11);
    			append_dev(div11, h13);
    			append_dev(div11, t10);
    			append_dev(div11, div10);
    			append_dev(div10, h30);
    			append_dev(div10, t12);
    			append_dev(div10, div8);
    			append_dev(div8, div5);
    			append_dev(div5, a0);
    			append_dev(div8, t14);
    			append_dev(div8, div6);
    			append_dev(div6, a1);
    			append_dev(div8, t16);
    			append_dev(div8, div7);
    			append_dev(div7, a2);
    			append_dev(div10, t18);
    			append_dev(div10, h31);
    			append_dev(div10, t20);
    			append_dev(div10, div9);
    			append_dev(div9, t21);
    			append_dev(div9, br);
    			append_dev(div9, t22);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, div14, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(div14);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.43.0 */

    const { console: console_1, window: window_1 } = globals;
    const file = "src/App.svelte";

    // (103:1) {:else}
    function create_else_block(ctx) {
    	let div4;
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let t0;
    	let button1;
    	let svg1;
    	let path1;
    	let t1;
    	let button2;
    	let div1;
    	let t2;
    	let div2;
    	let t3;
    	let div3;
    	let t4;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*expandNav*/ ctx[2] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t1 = space();
    			button2 = element("button");
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			t3 = space();
    			div3 = element("div");
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(path0, "d", "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z");
    			add_location(path0, file, 106, 101, 4094);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "50");
    			attr_dev(svg0, "height", "50");
    			attr_dev(svg0, "fill", "#fff8e7");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			add_location(svg0, file, 106, 5, 3998);
    			set_style(button0, "background-color", "#292b2c");
    			set_style(button0, "border", "none");
    			set_style(button0, "width", "60px");
    			set_style(button0, "height", "60px");
    			attr_dev(button0, "class", "svelte-nxl0js");
    			add_location(button0, file, 105, 4, 3894);
    			attr_dev(path1, "d", "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z");
    			add_location(path1, file, 109, 101, 5046);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "50");
    			attr_dev(svg1, "height", "50");
    			attr_dev(svg1, "fill", "#fff8e7");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file, 109, 5, 4950);
    			set_style(button1, "background-color", "#292b2c");
    			set_style(button1, "border", "none");
    			set_style(button1, "width", "60px");
    			set_style(button1, "height", "60px");
    			attr_dev(button1, "class", "svelte-nxl0js");
    			add_location(button1, file, 108, 4, 4844);
    			set_style(div0, "top", "3px");
    			set_style(div0, "position", "absolute");
    			set_style(div0, "left", "20px");
    			set_style(div0, "display", "flexbox");
    			set_style(div0, "width", "200px");
    			add_location(div0, file, 104, 3, 3805);
    			set_style(div1, "left", "-1px");
    			set_style(div1, "top", "-5px");
    			set_style(div1, "width", "40px");
    			set_style(div1, "height", "3px");
    			set_style(div1, "background-color", "#fff8e7");
    			set_style(div1, "position", "relative");
    			set_style(div1, "border-radius", "2px");
    			add_location(div1, file, 113, 4, 5617);
    			set_style(div2, "left", "-1px");
    			set_style(div2, "top", "0px");
    			set_style(div2, "width", "40px");
    			set_style(div2, "height", "3px");
    			set_style(div2, "background-color", "#fff8e7");
    			set_style(div2, "position", "relative");
    			set_style(div2, "border-radius", "2px");
    			add_location(div2, file, 114, 4, 5743);
    			set_style(div3, "left", "-1px");
    			set_style(div3, "top", "5px");
    			set_style(div3, "width", "40px");
    			set_style(div3, "height", "3px");
    			set_style(div3, "background-color", "#fff8e7");
    			set_style(div3, "position", "relative");
    			set_style(div3, "border-radius", "2px");
    			add_location(div3, file, 115, 4, 5868);
    			set_style(button2, "width", "55px");
    			set_style(button2, "height", "55px");
    			set_style(button2, "top", "10px");
    			set_style(button2, "border", "solid #fff8e7");
    			set_style(button2, "position", "relative");
    			set_style(button2, "left", "calc(100vw - 90px)");
    			set_style(button2, "border-radius", "8px");
    			set_style(button2, "background-color", "#292b2c");
    			attr_dev(button2, "class", "svelte-nxl0js");
    			add_location(button2, file, 112, 3, 5415);
    			attr_dev(div4, "class", "navbar svelte-nxl0js");
    			set_style(div4, "position", "absolute");
    			set_style(div4, "top", "0");
    			set_style(div4, "left", "0");
    			add_location(div4, file, 103, 2, 3740);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div4, t1);
    			append_dev(div4, button2);
    			append_dev(button2, div1);
    			append_dev(button2, t2);
    			append_dev(button2, div2);
    			append_dev(button2, t3);
    			append_dev(button2, div3);
    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", toGithub, false, false, false),
    					listen_dev(button1, "click", toLinkedin, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*expandNav*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*expandNav*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(103:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (80:1) {#if windowSize > 600}
    function create_if_block_2(ctx) {
    	let t0_value = console.log(window.innerWidth) + "";
    	let t0;
    	let t1;
    	let div3;
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let t2;
    	let button1;
    	let svg1;
    	let path1;
    	let t3;
    	let div1;
    	let logo;
    	let t4;
    	let div2;
    	let button2;
    	let t5;
    	let button2_style_value;
    	let t6;
    	let button3;
    	let t7;
    	let button3_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	logo = new Logo({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t3 = space();
    			div1 = element("div");
    			create_component(logo.$$.fragment);
    			t4 = space();
    			div2 = element("div");
    			button2 = element("button");
    			t5 = text("Home");
    			t6 = space();
    			button3 = element("button");
    			t7 = text("Projects");
    			attr_dev(path0, "d", "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z");
    			add_location(path0, file, 84, 101, 1897);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "50");
    			attr_dev(svg0, "height", "50");
    			attr_dev(svg0, "fill", "#fff8e7");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			add_location(svg0, file, 84, 5, 1801);
    			set_style(button0, "background-color", "#292b2c");
    			set_style(button0, "border", "none");
    			set_style(button0, "width", "60px");
    			set_style(button0, "height", "60px");
    			attr_dev(button0, "class", "svelte-nxl0js");
    			add_location(button0, file, 83, 4, 1697);
    			attr_dev(path1, "d", "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z");
    			add_location(path1, file, 87, 101, 2849);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "50");
    			attr_dev(svg1, "height", "50");
    			attr_dev(svg1, "fill", "#fff8e7");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file, 87, 5, 2753);
    			set_style(button1, "background-color", "#292b2c");
    			set_style(button1, "border", "none");
    			set_style(button1, "width", "60px");
    			set_style(button1, "height", "60px");
    			attr_dev(button1, "class", "svelte-nxl0js");
    			add_location(button1, file, 86, 4, 2647);
    			set_style(div0, "top", "3px");
    			set_style(div0, "position", "absolute");
    			set_style(div0, "left", "calc(100vw - 200px)");
    			set_style(div0, "display", "flexbox");
    			set_style(div0, "width", "200px");
    			add_location(div0, file, 82, 3, 1593);
    			set_style(div1, "left", "calc(50vw - 45px)");
    			set_style(div1, "position", "absolute");
    			set_style(div1, "top", "0");
    			add_location(div1, file, 90, 3, 3218);
    			attr_dev(button2, "class", "location svelte-nxl0js");

    			attr_dev(button2, "style", button2_style_value = /*current*/ ctx[0] == "home"
    			? "text-decoration:underline"
    			: "");

    			add_location(button2, file, 94, 4, 3396);
    			attr_dev(button3, "class", "location svelte-nxl0js");

    			attr_dev(button3, "style", button3_style_value = /*current*/ ctx[0] == "projects"
    			? "text-decoration:underline"
    			: "");

    			add_location(button3, file, 97, 4, 3548);
    			set_style(div2, "display", "flexbox");
    			set_style(div2, "flex-direction", "row");
    			set_style(div2, "top", "18px");
    			set_style(div2, "position", "absolute");
    			set_style(div2, "left", "50px");
    			add_location(div2, file, 93, 3, 3306);
    			attr_dev(div3, "class", "navbar svelte-nxl0js");
    			set_style(div3, "top", "0");
    			set_style(div3, "left", "0");
    			add_location(div3, file, 81, 2, 1548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			mount_component(logo, div1, null);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, button2);
    			append_dev(button2, t5);
    			append_dev(div2, t6);
    			append_dev(div2, button3);
    			append_dev(button3, t7);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", toGithub, false, false, false),
    					listen_dev(button1, "click", toLinkedin, false, false, false),
    					listen_dev(button2, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button3, "click", /*click_handler_1*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*current*/ 1 && button2_style_value !== (button2_style_value = /*current*/ ctx[0] == "home"
    			? "text-decoration:underline"
    			: "")) {
    				attr_dev(button2, "style", button2_style_value);
    			}

    			if (!current || dirty & /*current*/ 1 && button3_style_value !== (button3_style_value = /*current*/ ctx[0] == "projects"
    			? "text-decoration:underline"
    			: "")) {
    				attr_dev(button3, "style", button3_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_component(logo);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(80:1) {#if windowSize > 600}",
    		ctx
    	});

    	return block;
    }

    // (119:3) {#if expandNav}
    function create_if_block_3(ctx) {
    	let div;
    	let button0;
    	let t0;
    	let button0_style_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_style_value;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("Home");
    			t1 = space();
    			button1 = element("button");
    			t2 = text("Projects");
    			attr_dev(button0, "class", "dropdown svelte-nxl0js");

    			attr_dev(button0, "style", button0_style_value = /*current*/ ctx[0] == "home"
    			? "text-decoration:underline"
    			: "");

    			add_location(button0, file, 120, 5, 6108);
    			attr_dev(button1, "class", "dropdown svelte-nxl0js");

    			attr_dev(button1, "style", button1_style_value = "top:-3px;" + (/*current*/ ctx[0] == "projects"
    			? "text-decoration:underline"
    			: ""));

    			add_location(button1, file, 123, 5, 6262);
    			set_style(div, "position", "relative");
    			set_style(div, "top", "65px");
    			set_style(div, "left", "-8px");
    			add_location(div, file, 119, 4, 6034);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, t2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*current*/ 1 && button0_style_value !== (button0_style_value = /*current*/ ctx[0] == "home"
    			? "text-decoration:underline"
    			: "")) {
    				attr_dev(button0, "style", button0_style_value);
    			}

    			if (!current || dirty & /*current*/ 1 && button1_style_value !== (button1_style_value = "top:-3px;" + (/*current*/ ctx[0] == "projects"
    			? "text-decoration:underline"
    			: ""))) {
    				attr_dev(button1, "style", button1_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(119:3) {#if expandNav}",
    		ctx
    	});

    	return block;
    }

    // (130:1) {#if current === "home"}
    function create_if_block_1(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(130:1) {#if current === \\\"home\\\"}",
    		ctx
    	});

    	return block;
    }

    // (133:1) {#if current === "projects"}
    function create_if_block(ctx) {
    	let projects;
    	let current;
    	projects = new Projects({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(projects.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(projects, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(projects.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(projects.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(projects, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(133:1) {#if current === \\\"projects\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let body;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*windowSize*/ ctx[1] > 600) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*current*/ ctx[0] === "home" && create_if_block_1(ctx);
    	let if_block2 = /*current*/ ctx[0] === "projects" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			body = element("body");
    			if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(body, "class", "svelte-nxl0js");
    			add_location(body, file, 78, 0, 1480);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			if_blocks[current_block_type_index].m(body, null);
    			append_dev(body, t0);
    			if (if_block1) if_block1.m(body, null);
    			append_dev(body, t1);
    			if (if_block2) if_block2.m(body, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window_1, "resize", /*newSize*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(body, t0);
    			}

    			if (/*current*/ ctx[0] === "home") {
    				if (if_block1) {
    					if (dirty & /*current*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(body, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*current*/ ctx[0] === "projects") {
    				if (if_block2) {
    					if (dirty & /*current*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(body, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function toGithub() {
    	window.location.href = "https://github.com/LaneLewis";
    }

    function toLinkedin() {
    	window.location.href = "https://www.linkedin.com/in/lane-lewis-b7058b20a/";
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	function switchCurrent(loc) {
    		$$invalidate(0, current = loc);
    	}

    	let current = "home";
    	let windowSize = window.innerWidth;

    	function newSize() {
    		$$invalidate(1, windowSize = window.innerWidth);

    		if (windowSize < 600) {
    			$$invalidate(2, expandNav = false);
    		}
    	}

    	let expandNav = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		switchCurrent("home");
    	};

    	const click_handler_1 = () => {
    		switchCurrent("projects");
    	};

    	const click_handler_2 = () => {
    		$$invalidate(2, expandNav = !expandNav);
    	};

    	const click_handler_3 = () => switchCurrent("home");
    	const click_handler_4 = () => switchCurrent("projects");

    	$$self.$capture_state = () => ({
    		fade,
    		Logo,
    		Projects,
    		Home,
    		toGithub,
    		toLinkedin,
    		switchCurrent,
    		current,
    		windowSize,
    		newSize,
    		expandNav
    	});

    	$$self.$inject_state = $$props => {
    		if ('current' in $$props) $$invalidate(0, current = $$props.current);
    		if ('windowSize' in $$props) $$invalidate(1, windowSize = $$props.windowSize);
    		if ('expandNav' in $$props) $$invalidate(2, expandNav = $$props.expandNav);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		current,
    		windowSize,
    		expandNav,
    		switchCurrent,
    		newSize,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
