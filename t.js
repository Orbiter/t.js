/*
		 _     _
		| |   (_)
		| |_   _ ___
		| __| | / __|
		| |_ _| \__ \
		 \__(_) |___/
		     _/ |
		    |__/

	t.js
	a micro-templating framework in ~400 bytes gzipped

	@author  Jason Mooberry <jasonmoo@me.com>
	@license MIT
	@version 0.1.0

*/
(function () {

	var blockregex = /\{\{(([@!]?)(.+?))\}\}(([\s\S]+?)(\{\{:\1\}\}([\s\S]+?))?)\{\{\/\1\}\}/g,
		valregex = /\{\{([=%])(.+?)\}\}/g,
		conregex = /([^=><]+?)([!=>< ]+)(.+)$/;

	function t(template) {
		this.t = template;
	}

	function get_value(vars, key) {
        for (parts = key.split("."); parts.length;) {
			if (!(parts[0] in vars)) return false;
			vars = vars[parts.shift()];
		}
		return vars;
	}

	function get_value_con(vars, key) {
		var v = null;
		if ("'" == key.charAt(0) || '"' == key.charAt(0)) {
			v = key.substr(1);
			if ("'" == v.charAt(v.length - 1) || '"' == v.charAt(v.length - 1))	v = v.substr(0, v.length - 1);
		} else v = isNaN(key.charAt(0)) ? get_value(vars, key) : Number(key);
		return v;
	}

	function render(fragment, vars) {
		return fragment
			.replace(blockregex, function (_, __, meta, key, inner, if_true, has_else, if_false) {
				var val = get_value(vars, key), temp = "", i;
				if (!val) {
					// handle if not
					if ('!' == meta) return render(inner, vars);

                    if (consp = conregex.exec(key)) {
                        var l = get_value_con(vars,consp[1]);
                        var r = get_value_con(vars,consp[3]);
                        var conV = false;
                        switch(consp[2].replace(/\s/g,'')) { //do not use the eval(), it is not safe
                            case '==':  conV = (l == r);  break;
                            case '===': conV = (l === r); break;
                            case '>':   conV = (l > r);   break;
                            case '<':   conV = (l < r);   break;
                            case '>=':  conV = (l >= r);  break;
                            case '<=':  conV = (l <= r);  break;
                            case '!=':  conV = (l != r);  break;
                        }
                        if (conV) return render(inner, vars);
                    }

					// check for else
                    return has_else ? render(if_false, vars) : "";
				}

				// https://github.com/jasonmoo/t.js/issues/10
				if ('!' == meta) return "";

				// regular if
				if (!meta) return render(if_true, vars);

				// process array/obj iteration
				if ('@' == meta) {
					// store any previous vars
					// reuse existing vars
					_ = vars._key;
					__ = vars._val;
					for (i in val) val.hasOwnProperty(i) && (vars._key = i,	vars._val = val[i],	temp += render(inner, vars));
					vars._key = _;
					vars._val = __;
					return temp;
				}
			}).replace(valregex, function(_, meta, key) {
				return (val = get_value(vars,key)) || 0 === val ? (meta == '%' ? new Option(val).innerHTML.replace(/"/g, "&quot;") : val) : "";
			});
	}

	t.prototype.render = function (vars) {
		return render(this.t, vars);
	};

	window.t = t;
})();