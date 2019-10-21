// Component start

const MAIN_SELECTOR = 'select-component';

const ID = {
    TEMPLATE: 'select-template',
    COMPONENT: MAIN_SELECTOR,
    LABEL: `${MAIN_SELECTOR}--label`,
    INPUT: `${MAIN_SELECTOR}--input`,
    OPTIONS: `${MAIN_SELECTOR}--options`,
    SPINNER: `${MAIN_SELECTOR}--spinner`,
    DROPDOWN: `${MAIN_SELECTOR}--dropdown`,
};

const CSS = {
    OPTION_ITEM: `${MAIN_SELECTOR}--item`,
    OPTIONS_SHOW: `${MAIN_SELECTOR}--options__show`,
    SPINNER_HIDE: `${MAIN_SELECTOR}--spinner__hide`,
    DROPDOWN_SHOW: `${MAIN_SELECTOR}--dropdown__show`,
    EMPTY_INPUT: `${MAIN_SELECTOR}--label__empty_input`,
    INPUT_HAS_ITEM: `${MAIN_SELECTOR}--label__selected_item`,
    ITEM_SELECTED: `${MAIN_SELECTOR}--item__selected`,
};

class Select {
    /**
     *
     * @param {Object}        props
     * @param {String}        props.selector
     * @param {String}        props.label
     * @param {String}        props.url
     * @param {Function}      props.on_select
     * @param {Boolean}       props.always_fetch
     */
    constructor(props) {
        this._selector = props.selector;
        this._label = props.label;
        this._url = props.url;
        this._on_select = props.on_select;
        this._always_fetch = props.always_fetch;

        this._selected_item = {
            id: null,
            value: '',
        };

        this._build_template();
    }

    _build_template() {
        const template = document.getElementById(ID.TEMPLATE);
        const node = document.importNode(template.content, true);
        const selector = document.querySelector(this._selector);

        if (selector) {
            selector.appendChild(node);
            this._set_ui_elements();
            this._set_label();
            this._set_listeners();
        }
    }

    get selected_item() {
        return this._selected_item;
    }

    _set_ui_elements() {
        return this.UI = {
            LABEL: document.getElementById(ID.LABEL),
            INPUT: document.getElementById(ID.INPUT),
            OPTIONS: document.getElementById(ID.OPTIONS),
            DROPDOWN: document.getElementById(ID.DROPDOWN),
            SPINNER: document.getElementById(ID.SPINNER),
        };
    }

    _set_label() {
        if (this._label) {
            this.UI.LABEL.innerText = this._label;
        }
    }

    _set_listeners() {
        this.UI.INPUT.addEventListener('focus', this.open_dropdown.bind(this));
        this.UI.INPUT.addEventListener('change', this._handle_change.bind(this));
        this.UI.OPTIONS.addEventListener('click', this._handle_item_click.bind(this));
        document.addEventListener('click', this._handle_global_click.bind(this));
    }

    async open_dropdown() {
        try {
            this.UI.LABEL.classList.add(CSS.EMPTY_INPUT);
            this.UI.DROPDOWN.classList.add(CSS.DROPDOWN_SHOW);

            if (this._url && this._always_fetch) {
                this.json = await this._fetch_data();
            } else if (this._url && !this.json) {
                this.json = await this._fetch_data();
            }

            if (this._always_fetch) {
                this._append_options();
            } else if (!this.UI.OPTIONS.hasChildNodes()) {
                this._append_options();
            }

            if (!this._always_fetch && this.selected_item.id) {
                this._clear_selected();
            }

            this._select_option();
            this._toggle_dropdown_ui_after_options_fetched();
        } catch (e) {
            this.UI.DROPDOWN.classList.remove(CSS.DROPDOWN_SHOW);
            console.error(e);
        }
    }

    async _fetch_data() {
        const response = await fetch(this._url);
        return await response.json();
    }

    _append_options() {
        if (this.json && typeof this.json === 'object') {
            this.UI.OPTIONS.innerHTML = this._get_options_from_object(this.json);
        } else if (this.json && Array.isArray(this.json)) {
            this.UI.OPTIONS.innerHTML = this._get_options_from_array(this.json);
        }
    }

    _get_options_from_object(json) {
        let html = '';
        let id = 0;

        for (let key in json) {
            if (json.hasOwnProperty(key)) {
                html += `<li class="${CSS.OPTION_ITEM}" id="${key}" data-option-id="${id++}">${json[key].label}</li>`;
            }
        }

        return html;
    }

    _get_options_from_array(json) {
        let html = '';

        json.forEach((item, index) => {
            html += `<li class="${CSS.OPTION_ITEM}" id="${index}" data-option-id="${index}">${item.label}</li>`;
        });

        return html;
    }

    _toggle_dropdown_ui_after_options_fetched() {
        this.UI.SPINNER.classList.add(CSS.SPINNER_HIDE);
        this.UI.OPTIONS.classList.add(CSS.OPTIONS_SHOW);
    }

    _handle_item_click(event) {
        if (event.target.tagName === 'LI') {
            this._set_selected_item({
                id: event.target.getAttribute('data-option-id'),
                value: event.target.innerText,
            });
            this._set_input_value(event.target.innerText);
            this.UI.DROPDOWN.classList.remove(CSS.DROPDOWN_SHOW);
        }
    }

    _clear_selected() {
        const options = this.UI.OPTIONS.querySelectorAll('[data-option-id]');

        for (let option of options) {
            option.classList.remove(CSS.ITEM_SELECTED);
        }
    }

    _select_option() {
        const options = this.UI.OPTIONS.querySelectorAll('[data-option-id]');

        if (this.selected_item.id) {
            options[this.selected_item.id].classList.add(CSS.ITEM_SELECTED);
        }
    }

    set_element(index) {
        if (!Number.isNaN(index)) {
            const safe_index = Math.abs(parseInt(index, 10));
            const options = this.UI.OPTIONS.querySelectorAll('[data-option-id]');

            if (options && options.length > safe_index) {
                this._set_selected_item({
                    id: safe_index,
                    value: options[safe_index].innerText,
                });
                this._set_input_value(options[safe_index].innerText);
            }
        }
    }

    _set_input_value(value) {
        this.UI.INPUT.value = value;
        this.UI.INPUT.dispatchEvent(new Event('change'));
    }

    _set_selected_item({id, value}) {
        this._selected_item = {
            id,
            value,
        }
    }

    _handle_global_click(event) {
        if (event.target && !event.target.closest(`#${ID.COMPONENT}`)) {
            this.UI.DROPDOWN.classList.remove(CSS.DROPDOWN_SHOW);
            this.UI.LABEL.classList.remove(CSS.EMPTY_INPUT);
        }
    }

    _handle_change() {
        if (this.UI.INPUT.value) {
            this.UI.LABEL.classList.add(CSS.INPUT_HAS_ITEM);
            this.UI.LABEL.classList.remove(CSS.EMPTY_INPUT);

            if (typeof this._on_select === 'function') {
                this._on_select(this.selected_item);
            }
        } else {
            this.UI.LABEL.classList.remove(CSS.INPUT_HAS_ITEM);
            this.UI.LABEL.classList.remove(CSS.EMPTY_INPUT);
        }
    }

    close_dropdown() {
        if (this.UI.DROPDOWN.classList.contains(CSS.DROPDOWN_SHOW)) {
            this.UI.DROPDOWN.classList.remove(CSS.DROPDOWN_SHOW);
        }
    }

    clear_select() {
        this._set_input_value('');
        this._set_selected_item({
            id: null,
            value: ''
        });
        this.close_dropdown();
    }

    destroy() {
        document.getElementById(MAIN_SELECTOR).remove();
    }
}

// Component end

const select = new Select({
    selector: '#select',
    label: 'Выберите технологию',
    url: 'https://vladilen-dev.firebaseio.com/technologies.json',
    always_fetch: false,
    on_select,
});

function on_select(selectedItem) {
    const log = document.getElementById('log');

    if (log) {
        log.innerText = `Selected item: ${selectedItem.value}`;
    }
}

((select) => {
    const buttons = document.querySelectorAll('[data-type]');

    const set_events = (button) => {
        switch (button.getAttribute('data-type')) {
            case 'open':
                button.onclick = (e) => {
                    e.stopPropagation();
                    select.open_dropdown()
                };
                break;
            case 'close':
                button.onclick = () => select.close_dropdown();
                break;
            case 'get':
                button.onclick = () => alert(JSON.stringify(select.selected_item));
                break;
            case 'set':
                button.onclick = () => select.set_element(5);
                break;
            case 'clear':
                button.onclick = () => select.clear_select();
                break;
            case 'destroy':
                button.onclick = () => select.destroy();
                break;
        }
    };

    if (buttons) {
        for (let button of buttons) {
            set_events(button);
        }
    }
})(select);
