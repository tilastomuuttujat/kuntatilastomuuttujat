/* global PULI_UTIL, tinyMCE, responsiveVoice */

var _combine_input = function () {
  // 開頭設定
  _reset_result();
  //var _result = "";
  //var _panel = $(".file-process-framework");
  _data = {};
  // ------------------------------------------
  // 資料處理設定


  _calc_pearson_correlation();

  // ------------------------------------------
  // 結束設定


};	// var _combine_input = function () {

_attr_list_count = 0;

var _calc_pearson_correlation = function () {
  //var _result = "";
  var _attr_list = [];
  _attr_list_count = 0;
  var _panel = $(".file-process-framework");

  var _csv_lines = _panel.find("#input_data").val().trim().split("\n");

  if (_csv_lines.length === 0) {
    return "";
  }

  //var _data = {};
  var _pair_number;
  //var _attr_list = [];

  // ----------------------------
  // load data

  for (var _i = 0; _i < _csv_lines.length; _i++) {
    let _line = _csv_lines[_i]
    if (_line.indexOf('\t') > -1) {
      _line = _line.split('\t')
    } else {
      _line = _line.split(',')
    }
    if (_pair_number === undefined) {
      _pair_number = _line.length;
    } else if (_pair_number !== _line.length) {
      return "";
    }

    for (var _j = 0; _j < _line.length; _j++) {
      var _value = _line[_j];

      if (_i === 0) {
        _data[_value] = [];
        _attr_list[_j] = _value;
        _attr_list_count++;
      } else {
        if (isNaN(_value)) {
          //_attr_list.splice(_j, 1);
          continue;
        }
        _value = eval(_value);
        _data[(_attr_list[_j])].push(_value);
      }
    }
  }

  if ($("#input_test_of_rank:checked").length === 1) {
    for (var _attr_name in _data) {
      var arr = _data[_attr_name];
      var sorted = arr.slice().sort(function (a, b) {
        return b - a
      })
      var ranks = arr.slice().map(function (v) {
        return sorted.indexOf(v) + 1
      });
      _data[_attr_name] = ranks;
    }
  }

  //console.log(_attr_list);
  if (_attr_list_count === 1 && $("#input_test_of_trend:checked").length === 1) {
    // 加入時間序號
    var _value = 'time_index';
    _data[_value] = [];
    _attr_list[_j] = _value;
    for (var _t = 1; _t < _csv_lines.length; _t++) {
      _data[_value].push(_t);
    }
  }

  // -----------------------------------
  // 畫變數表

  var _var_container = _panel.find("#variables_container");
  _var_container.empty();
  for (var _i = 0; _i < _attr_list.length; _i++) {
    var _attr = _attr_list[_i];
    if (_data[_attr].length === 0) {
      continue;
    }
    var _div = $('<div class="field"><div class="ui checkbox">'
            + '<input type="checkbox" name="variables" value="' + _attr + '" id="variables_' + _i + '" checked="checked" /> '
            + '<label for="variables_' + _i + '">'
            //+ '<i class="resize vertical icon"></i> '
            + '<i class="sort icon"></i>'
            //+ '<img src="drag_reorder1.png" />'
            + _attr
            + '</label>'
            + '</div></div>');
    _div.appendTo(_var_container);
    _div.find('input').change(_draw_result_table);
    _div.bind('dragstop', _draw_result_table);
  }

  // -----------------------------------

  // console.log(_data);
  return _draw_result_table();
};

var _is_variable_selected = function (_attr) {
  return ($('[name="variables"][value="' + _attr + '"]:checked').length === 1);
};

_data = {};
_cox_stuart_result = null;

var _get_attr_list = function () {
  var _attr_list = [];
  $('[name="variables"]:checked').each(function (_i, _ele) {
    _attr_list.push(_ele.value);
  });
  return _attr_list;
};

var _draw_result_table = function () {

  _reset_result();
  var _result_div = $('<div></div>');

  var _attr_list = _get_attr_list();

  // -------------------------------------
  // 描述性統計量

  _result_div.append(_draw_descriptive_table());

  // ------------------------
  // 先畫表格吧...
  var _result_data = {};
  for (var _i = 0; _i < _attr_list.length; _i++) {
    var _x_attr = _attr_list[_i];

    if (_is_variable_selected(_x_attr) === false) {
      continue;
    }

    var _ary1 = _data[_x_attr];
    for (var _j = 0; _i !== _attr_list.length - 1 && _j < _i; _j++) {
      var _y_attr = _attr_list[_j];
      if (_is_variable_selected(_y_attr) === false) {
        continue;
      }
      if (typeof (_result_data[_x_attr]) === "undefined") {
        _result_data[_x_attr] = {};
      }

      if (_j !== _i) {
        _result_data[_x_attr][_y_attr] = null;
      }
    }

    for (var _j = _i + 1; _j < _attr_list.length; _j++) {
      var _y_attr = _attr_list[_j];
      if (_is_variable_selected(_y_attr) === false) {
        continue;
      }
      if (typeof (_result_data[_x_attr]) === "undefined") {
        _result_data[_x_attr] = {};
      }


      var _ary2 = _data[_y_attr];
      _result_data[_x_attr][_y_attr] = _get_pearson_correlation(_ary1, _ary2);
    }
  }

  //console.log(_result_data);
  // -----------------------------------

  var _precision = $("#input_precise").val();
  _precision = eval(_precision);


  var _display_detail = ($("#input_display_detail:checked").length === 1);
  var _colspan = 2;
  if (_display_detail === false) {
    _colspan = 1;
  }

  var _table = $('<div style="display:inline-block;">'
          + '<div class="caption" style="text-align:center;display:block">相關分析</div>'
          + '<table border="1" cellpadding="0" cellspacing="0">'
          //+ '<caption>' + "相關分析" + '</caption>'
          + '<thead><tr class="x-attr"><th colspan="' + _colspan + '" class="right-border-bold"></th></tr></thead>'
          + '<tbody></tbody>'
          + '</table><div class="note" style="text-align:left;"></div></div>');
  if ($("#input_table_style_display:checked").length === 0) {
    _table.addClass("analyze-result");
  }
  var _tr_x_attr = _table.find("tr.x-attr");

  var _tbody = _table.find("tbody");
  var _note = _table.find(".note");
  var _sign = {
    "*": false,
    "**": false,
    "***": false
  };

  for (var _x_attr in _result_data) {

    if (_tr_x_attr.find('th[data-attr="' + _x_attr + '"]').length === 0) {
      _tr_x_attr.append('<th data-attr="' + _x_attr + '">' + _x_attr + '</th>');
    }
    //console.log(['x', _x_attr]);

    for (var _y_attr in _result_data[_x_attr]) {

      var _d = _result_data[_x_attr][_y_attr];
      var _tr_y_attr_r = _tbody.find('tr.r[data-attr="' + _y_attr + '"]');
      var _tr_y_attr_p = _tbody.find('tr.p[data-attr="' + _y_attr + '"]');
      var _tr_y_attr_r2 = _tbody.find('tr.r2[data-attr="' + _y_attr + '"]');
      var _tr_y_attr_n = _tbody.find('tr.n[data-attr="' + _y_attr + '"]');
      if (_tr_y_attr_r.length === 0) {
        if (_d !== null) {
          _tr_y_attr_r = $('<tr class="row r" data-attr="' + _y_attr + '"></tr>');
          _tbody.append(_tr_y_attr_r);
          if (_display_detail === true) {
            _tr_y_attr_p = $('<tr class="row p" data-attr="' + _y_attr + '"></tr>');
            _tbody.append(_tr_y_attr_p);
            _tr_y_attr_r2 = $('<tr class="row r2" data-attr="' + _y_attr + '"></tr>');
            _tbody.append(_tr_y_attr_r2);
            _tr_y_attr_n = $('<tr class="row n" data-attr="' + _y_attr + '"></tr>');
            _tbody.append(_tr_y_attr_n);
          }

          if (_display_detail === false) {
            _tr_y_attr_r.addClass("bottom-border-thin");
          }
        }

        var _rowspan = 1;
        if (_display_detail === true) {
          _rowspan = 4;
        }

        _tr_y_attr_r.append('<th class="right-border-none bottom-border-thin" rowspan="' + _rowspan + '" align="left" valign="top">' + _y_attr + '</th>');

        if (_display_detail === true) {
          //_tr_y_attr_r.append('<td class="right-border-bold">Pearson相關<br />顯著性(雙尾)<br />個數</td>');
          _tr_y_attr_r.append('<th class="right-border-bold left-border-none" align="left">Pearson相關係數r</th>');
          _tr_y_attr_p.append('<th class="right-border-bold left-border-none" align="left">顯著性(雙尾)p值</th>');
          _tr_y_attr_r2.append('<th class="right-border-bold left-border-none" align="left">決定係數</th>');
          _tr_y_attr_n.append('<th class="right-border-bold left-border-none bottom-border-thin" align="left">個數</th>');
        }
      }

      //console.log(['y', _y_attr, _d]);

      var _td_r = $('<td align="right"></td>').appendTo(_tr_y_attr_r);

      if (_display_detail === true) {
        var _td_p = $('<td align="right"></td>').appendTo(_tr_y_attr_p);
        var _td_r2 = $('<td align="right"></td>').appendTo(_tr_y_attr_r2);
        var _td_n = $('<td align="right"></td>').appendTo(_tr_y_attr_n);
      }

      if (_display_detail === true) {
        _td_n.addClass("bottom-border-thin");
      } else {
        _td_r.addClass("bottom-border-thin");
      }

      if (_d !== null) {
        //var _text = [];
        var _r = precision_string(_d.r, _precision);
        var _origin_r = _r;
        var _r2 = precision_string(_d.r * _d.r, _precision);
        if (_d.p < 0.001) {
          _r = _r + '<sup>***</sup>';
          _sign["***"] = true;
        } else if (_d.p < 0.01) {
          _r = _r + '<sup>**</sup>';
          _sign["**"] = true;
        } else if (_d.p < 0.05) {
          _r = _r + '<sup>*</sup>';
          _sign["*"] = true;
        }

        //_text.push(_r);
        if (_display_detail === true) {
          var _p = precision_string(_d.p, _precision);
          //var _p = _d.p;
          //_text.push(_p);
          var _n = _d.n;
          //_text.push(_n);
        }
        _td_r.html(_r);

        if (Math.abs(_origin_r) > 0.7) {
          _td_r.attr("correlation", "high");
        } else if (Math.abs(_origin_r) > 0.4) {
          _td_r.attr("correlation", "middle");
        } else {
          _td_r.attr("correlation", "low");
        }

        if (_d.p < 0.05) {
          _td_r.attr("significant", "true");
        } else {
          _td_r.attr("significant", "false");
        }

        _td_r.attr("x_var", _x_attr);
        _td_r.attr("y_var", _y_attr);
        _td_r.attr("r", _origin_r);
        var _dir = "plus";
        if (_origin_r < 0) {
          _dir = "minus";
        }
        _td_r.attr("dir", _dir);

        if (_display_detail === true) {
          _td_p.html(_p);
          _td_r2.html(_r2);
          _td_n.html(_n);
        }
      }
    }
  }

  // -------------------------------------------------

  var _tr_td = 0;
  var _rows = _table.find("tr.row");
  for (var _i = 0; _i < _rows.length; _i++) {
    var _len = _rows.eq(_i).find("td").length;
    if (_len > _tr_td) {
      _tr_td = _len;
    }
  }

  for (var _i = 0; _i < _rows.length; _i++) {
    while (_rows.eq(_i).find("td").length < _tr_td) {
      _rows.eq(_i).append('<td></td>');
    }
  }

  // -------------------------------------------------

  _result_div.append(_table);

  for (var _i in _sign) {
    if (_sign[_i] === true) {
      var _s = 0.05;
      if (_i === "**") {
        _s = 0.01;
      } else if (_i === "***") {
        _s = 0.001;
      }
      _note.append('<div>' + _i + '. 在顯著水準為' + _s + '時(雙尾)，相關顯著。</div>');
    }
  }

  // ------------------------

  if (_attr_list_count === 1 && $("#input_test_of_trend:checked").length === 1) {

    for (var _attr_name in _data) {
      if (_attr_name === "time_index") {
        continue;
      } else {
        _cox_stuart_result = _test_of_trend_cox_stuart(_data[_attr_name]);
        _result_div.append('<br />');
        _result_div.append(_cox_stuart_result.table);
        break;
      }
    }
  }

  // ------------------------

  _create_conclusion(_result_div).appendTo(_result_div);

  // -------------------------

  //return _div.html();
  var _panel = $(".file-process-framework");
  var _result = _result_div.html();
  var _input = _panel.find("#preview");
  _input.val(_result);

  _panel.find("#preview_html").append(_result_div.children());
};

var _create_conclusion = function (_result_div) {

  var _result = [];
  _result.push("<div>相關分析結果：</div>");

  // ---------------------------

  var _attr_list = _get_attr_list();
  var _attr_desc = "";
  for (var _i = 0; _i < _attr_list.length; _i++) {
    if (_i > 0) {
      if (_i < _attr_list.length - 1) {
        _attr_desc += "、";
      } else {
        _attr_desc += "與";
      }
    }
    _attr_desc += _attr_list[_i];
  }

  _result.push("<div>本研究使用積差相關分析來分析" + _attr_desc + "兩兩變項之間是否有線性相關。</div>");

  // ---------------------------

  for (var _i = 0; _i < _attr_list.length; _i++) {
    var _name = _attr_list[_i];
    var _tr = _result_div.find('.descriptive-table tr[var_name="' + _attr_list[_i] + '"]');
    _result.push(_name + "的平均數為" + _tr.find(".avg").text() + "，標準差為" + _tr.find(".stdev").text() + "，樣本數為" + _tr.find(".count").text() + "。");
  }

  // ---------------------------

  _result.push("<br /><div>相關分析結果顯示：</div>");

  var _sig_pair_high = [];

  _result_div.find('[correlation="high"][significant="true"]').each(function (_i, _td_r) {
    _td_r = $(_td_r);
    var _x_var = _td_r.attr("x_var");
    var _y_var = _td_r.attr("y_var");
    var _r = _td_r.attr("r");
    var _dir = _td_r.attr("dir");
    var _sig = (_td_r.attr("significant") === "true");

    var _desc = _x_var + "與" + _y_var;

    if (_dir === "plus") {
      _desc += "二者具有顯著的高度正相關，表示" + _x_var + "越高者，" + _y_var + "也會越高。";
    } else {
      _desc += "二者具有顯著的高度負相關，表示" + _x_var + "越高者，" + _y_var + "就會越低，反之亦然。";
    }

    _result.push(_desc);
    //_ul1.push("<li>" + _desc + "</li>");
    _sig_pair_high.push({
      x_var: _x_var.trim(),
      y_var: _y_var.trim(),
      r: _r,
      sig: _sig
    });
  });

  _result_div.find('[correlation="middle"][significant="true"]').each(function (_i, _td_r) {
    _td_r = $(_td_r);
    var _x_var = _td_r.attr("x_var");
    var _y_var = _td_r.attr("y_var");
    var _r = _td_r.attr("r");
    var _dir = _td_r.attr("dir");
    var _sig = (_td_r.attr("significant") === "true");

    //var _desc = _x_var + "與" + _y_var + "的相關係數為" + _r + "，";
    var _desc = _x_var + "與" + _y_var;

    if (_dir === "plus") {
      _desc += "二者具有顯著的中度正相關，表示" + _x_var + "越高者，" + _y_var + "也會越高。";
    } else {
      _desc += "二者具有顯著的中度負相關，表示" + _x_var + "越高者，" + _y_var + "就會越低，反之亦然。";
    }

    _result.push(_desc);
    //_ul1.push("<li>" + _desc + "</li>");
    _sig_pair_high.push({
      x_var: _x_var.trim(),
      y_var: _y_var.trim(),
      r: _r,
      sig: _sig
    });
  });

  //var _ul3 = _result.find("ul.group3");
  /*
   _result_div.find('[correlation="middle"][significant="true"]').each(function (_i, _td_r) {
   _td_r = $(_td_r);
   var _x_var = _td_r.attr("x_var");
   var _y_var = _td_r.attr("y_var");
   var _r = _td_r.attr("r");
   var _dir = _td_r.attr("dir");
   
   var _desc = _x_var + "與" + _y_var;
   
   if (_dir === "plus") {
   _desc += "具有顯著的中度正相關，表示" + _x_var + "越高者，" + _y_var + "也會越高。";
   }
   else {
   _desc += "具有顯著的中度負相關，表示" + _x_var + "越高者，" + _y_var + "就會越低，反之亦然。";
   }
   
   _result.push(_desc);
   _sig_pair_high.push({
   x_var: _x_var,
   y_var: _y_var,
   r: _r
   });
   });
   */

  // --------------------------

  // -------------------------

  var _sig_pair_middle = [];
  var _middle = [];
  //var _ul2 = _result.find("ul.group2");
  _result_div.find('[correlation="high"][significant="false"]').each(function (_i, _td_r) {
    _td_r = $(_td_r);
    var _x_var = _td_r.attr("x_var");
    var _y_var = _td_r.attr("y_var");
    var _r = _td_r.attr("r");
    var _dir = _td_r.attr("dir");
    var _sig = (_td_r.attr("significant") === "true");

    var _desc = _x_var + "與" + _y_var;

    if (_dir === "plus") {
      _desc += "具有高度正相關";
    } else {
      _desc += "具有高度負相關";
    }

    _middle.push(_desc);

    _sig_pair_middle.push({
      x_var: _x_var.trim(),
      y_var: _y_var.trim(),
      r: _r,
      sig: _sig
    });
  });

  _result_div.find('[correlation="middle"][significant="false"]').each(function (_i, _td_r) {
    _td_r = $(_td_r);
    var _x_var = _td_r.attr("x_var");
    var _y_var = _td_r.attr("y_var");
    var _r = _td_r.attr("r");
    var _dir = _td_r.attr("dir");
    var _sig = (_td_r.attr("significant") === "true");

    var _desc = _x_var + "與" + _y_var;

    if (_dir === "plus") {
      _desc += "具有中度正相關";
    } else {
      _desc += "具有中度負相關";
    }

    _middle.push(_desc);

    _sig_pair_middle.push({
      x_var: _x_var.trim(),
      y_var: _y_var.trim(),
      r: _r,
      sig: _sig
    });
  });

  if (_middle.length > 0) {

    if (_result.length > 1 && _sig_pair_high.length > 0) {
      console.log(222);
      _result.push("此外，");
    }

    var _middle_desc = _middle.join("；") + "。但以上相關皆無達到顯著水準，僅供參考。";

    _result.push(_middle_desc);
  }

  // --------------------------
  var _sig_pair_low = [];
  var _low = [];


  _result_div.find('[correlation="low"][significant="true"]').each(function (_i, _td_r) {
    //console.log(1111);
    _td_r = $(_td_r);
    var _x_var = _td_r.attr("x_var");
    var _y_var = _td_r.attr("y_var");
    var _r = _td_r.attr("r");
    var _dir = _td_r.attr("dir");
    var _sig = (_td_r.attr("significant") === "true");

    var _desc = _x_var + "與" + _y_var;

    if (_dir === "plus") {
      _desc += "具有顯著的低度正相關";
    } else {
      _desc += "具有顯著的低度負相關";
    }

    _low.push(_desc);

    _sig_pair_low.push({
      x_var: _x_var.trim(),
      y_var: _y_var.trim(),
      r: _r,
      sig: _sig
    });
  });

  if (_sig_pair_low.length > 0) {

    if (_result.length > 1 && _sig_pair_high.length > 0 && _sig_pair_middle.length > 0) {
      // console.log(222);
      _result.push("此外，");
    }

    var _low_desc = _low.join("；") + "，但因為相關係數過低，僅供參考。";

    _result.push(_low_desc);
  }

  // ------------------------------

  var _sig_pair_null = [];

  var _null = [];

  _result_div.find('[correlation="low"][significant="false"]').each(function (_i, _td_r) {
    _td_r = $(_td_r);
    var _x_var = _td_r.attr("x_var");
    var _y_var = _td_r.attr("y_var");
    var _r = _td_r.attr("r");
    var _dir = _td_r.attr("dir");
    var _sig = (_td_r.attr("significant") === "true");

    var _desc = _x_var + "與" + _y_var;

    _null.push(_desc);

    _sig_pair_null.push({
      x_var: _x_var.trim(),
      y_var: _y_var.trim(),
      r: _r,
      sig: _sig
    });
  });

  if (_null.length > 0) {

    if (_result.length > 1) {
      if (_middle.length === 0 && _sig_pair_high.length === 0) {

      } else if (_middle.length === 0 && _sig_pair_high.length > 0) {
        //console.log(111);
        _result.push("此外，");
      } else {
        _result.push("最後，");
      }
    }

    var _desc = _null.join("、");
    _desc += "之間的線性關係";

    if (_null.length > 1) {
      _desc += "皆";
    } else {
      _desc += "並";
    }

    _desc += "不明顯。";



    _result.push(_desc);
  }

  if (_result.length < 2) {
    _result = [];
  } else {
    _result.push("<br />相關分析到此結束。");
  }

  if (_attr_list_count === 1 && $("#input_test_of_trend:checked").length === 1) {
    var _cox_stu_msg = "Cox-Stuart趨勢分析結果顯示，"
            + "檢定統計量" + _cox_stuart_result.test_method + "為" + _cox_stuart_result.test_result + "，";
    if (_cox_stuart_result.test_method === "P") {
      if (_cox_stuart_result.is_sig === true) {
        _cox_stu_msg = _cox_stu_msg + "小於0.025，表示該資料有特殊變化趨勢。";
      } else {
        _cox_stu_msg = _cox_stu_msg + "大於或等於0.025，表示該資料無特殊變化趨勢。";
      }
    } else {
      if (_cox_stuart_result.is_sig === true) {
        _cox_stu_msg = _cox_stu_msg + "大於或等於1.96，表示該資料有特殊變化趨勢。";
      } else {
        _cox_stu_msg = _cox_stu_msg + "小於1.96，表示該資料無特殊變化趨勢。";
      }
    }
    if (_cox_stuart_result.is_sig === true) {
      if (_cox_stuart_result.is_growth === true) {
        _cox_stu_msg = _cox_stu_msg + "趨勢為遞增。";
      } else {
        _cox_stu_msg = _cox_stu_msg + "趨勢為遞減。";
      }
    }
    _result.push('<br />' + _cox_stu_msg);
  }


  // ------------------------------------------------------------------------------------

  var _return_div = $('<div class="conclusion"></div>').html(_result.join("<br />"));

  var _button = $('<button type="button" class="ui icon button tiny teal speak"><i class="talk icon"></i></button>').prependTo(_return_div);
  _button.click(function () {
    //console.log(0);
    /*
     var _loop = function (_i) {
     if (_i < _result.length) {
     var _t = _result[_i];
     //console.log(_t);
     responsiveVoice.speak(_t, 'Chinese Female', {
     rate: 1.2,
     onend: function () {
     _i++;
     _loop(_i);
     }
     });
     }
     };
     _loop(0);
     */
    var _t = $("<div>" + _result.join() + "</div>").text();
    _t = _t.split("'").join(" ");
    _t = _t.split(",").join(" ");
    //console.log(_t);
    responsiveVoice.speak(_t, 'Chinese Female', {
      rate: 1.2
    });
  });

  // -----------------------------------
  // pair result

  var _pair_result = $('<div><hr />'
          + '<div class="high">相關分析中顯著且高度或中度相關，非常具有參考價值：'
          + '<table border="1" cellpadding="0" cellspacing="0" class="sig-table group0"><thead><tr><td>變數x</td><td>變數y</td><td>r</td><td>顯著</td></tr></thead><tbody></tbody></table>'
          + '</div>'
          + '<div class="middle">相關分析中高度或中度相關，仍具有參考價值：'
          + '<table cellpadding="0" cellspacing="0"  border="1" class="sig-table group1"><thead><tr><td>變數x</td><td>變數y</td><td>r</td><td>顯著</td></tr></thead><tbody></tbody></table>'
          + '</div>'
          + '<div class="low">相關分析中低度或無相關，參考價值不大：'
          + '<table cellpadding="0" cellspacing="0"  border="1" class="sig-table group2"><thead><tr><td>變數x</td><td>變數y</td><td>r</td><td>顯著</td></tr></thead><tbody></tbody></table></div>'
          + '</div>').appendTo(_return_div);

  var _sig_pair_array = [_sig_pair_high, _sig_pair_middle, _sig_pair_low];
  for (var _i = 0; _i < _sig_pair_array.length; _i++) {
    var _sig_pair = JSON.parse(JSON.stringify(_sig_pair_array[_i]));
    _sig_pair = _sig_pair.sort(function (_a, _b) {
      //console.log([_a.x_var, _b.x_var, _a.x_var > _b.x_var]);
      if (_a.x_var !== _b.x_var) {
        return (_b.x_var < _a.x_var);
      } else {
        return (_b.y_var < _a.y_var);
      }
    });
    //_sig_pair.sort(function (_a, _b) {
    //    return (_b.r - _a.r);
    //});
    var _group_ul = _pair_result.find("table.group" + _i + ' tbody');

    for (var _j = 0; _j < _sig_pair.length; _j++) {
      var _s = _sig_pair[_j];

      $('<tr>'
              + '<td>' + _s.x_var + '</td>'
              + '<td>' + _s.y_var + '</td>'
              + '<td>' + _s.r + '</td>'
              + '<td>' + _s.sig + '</td>'
              + '</tr>').appendTo(_group_ul);
    }
  }

  if (_pair_result.find('div.high table tbody tr').length === 0) {
    _pair_result.find('div.high').hide();
  }
  if (_pair_result.find('div.middle table tbody tr').length === 0) {
    _pair_result.find('div.middle').hide();
  }
  if (_pair_result.find('div.low table tbody tr').length === 0) {
    _pair_result.find('div.low').hide();
  }

  // --------------------------------------

  var _ai = $(".ai-conclusion:visible");
  if (_ai.length > 0) {
    _ai.empty().append(_return_div.clone(true));
    //_ai.find("button").click();
  }

  // ------------------------------------------

  return _return_div;
};

var _draw_descriptive_table = function () {
  var _attr_list = _get_attr_list();

  //var _result_div = $('<div></div>');
  var _table = $('<div class="descriptive-table">'
          + '<div style="text-align:center;display:inline-block" class="caption">樣本敘述統計量</caption>'
          + '<table border="1" cellspacing="0" cellpadding="0">'
          + '<thead><tr><th class="right-border-bold"></th><th>平均數</th><th>標準差</th><th>個數</th></tr></thead>'
          + '<tbody></tbody></table></div>');
  if ($("#input_table_style_display:checked").length === 0) {
    _table.addClass("analyze-result");
  }
  var _tbody = _table.find('tbody');

  for (var _i = 0; _i < _attr_list.length; _i++) {
    var _attr = _attr_list[_i];
    var _d = _data[_attr];
    var _avg = _calc_avg(_d);
    var _stdev = _calc_stdev(_d);

    var _tr = $('<tr var_name="' + _attr + '">'
            + '<th align="left">' + _attr + '</th>'
            + '<td align="right" class="avg">' + _get_fix_precision(_avg) + '</td>'
            + '<td align="right" class="stdev">' + _get_fix_precision(_stdev) + '</td>'
            + '<td align="right" class="count">' + _d.length + '</td></tr>').appendTo(_tbody);
  }

  return _table;
};

var _get_fix_precision = function (_number) {
  var _precision = $("#input_precise").val();
  _precision = eval(_precision);
  return precision_string(_number, _precision);
};

var _get_pearson_correlation = function (_ary1, _ary2) {

  var _r = pearsonCorrelation(_ary1, _ary2);
  //_r = Math.abs(_r);
  var _n = _ary1.length;

  var _t = _r * Math.sqrt((_n - 2) / (1 - (_r * _r)));
  _t = Math.abs(_t);
  var _p = ((tprob((_n - 2), _t)) * 2);
  //console.log(_p);
  if (_p === 2) {
    _p = 0;
  }

  if (isNaN(_p)) {
    console.log({
      'n-2': _n - 2,
      't': _t
    });
    console.log(['tprob', tprob((_n - 2), _t)]);
    throw "錯誤：NaN (r: " + _r + ";t: " + _t + "; _n: " + _n + " )";
  }

  return {
    r: _r,
    p: _p,
    n: _n
  };
};

// -----------------------------------------------------

/*
tinyMCE.init({
  mode: "specific_textareas",
  editor_selector: "mceEditor",
  plugins: [
    'advlist autolink lists link image charmap print preview hr anchor pagebreak',
    'searchreplace wordcount visualblocks visualchars code fullscreen',
    'insertdatetime media nonbreaking save table contextmenu directionality',
    'emoticons template paste textcolor colorpicker textpattern imagetools codesample toc'
  ],
  toolbar1: 'undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image  tableprops',
  toolbar2: 'print preview media | forecolor backcolor emoticons | codesample code ',
  setup: function (ed) {
    ed.on('change', function (e) {
      //console.log('the content ', ed.getContent());
      _combine_input();
    });
  }
});
*/

var _reset_result = function () {

  var _panel = $(".file-process-framework");
  var _input = _panel.find("#preview");
  _input.val("");

  _panel.find("#preview_html").html("");
};

// --------------------------

var _process_file = function (_input, _callback) {
  _callback(_input);
};

var _output_filename_surffix = "_output";

// -------------------------------------

var _load_file = function (evt) {
  //console.log(1);
  if (!window.FileReader)
    return; // Browser is not compatible

  var _file_input = this;
  var _selector = $(this).data("file-to-textarea");
  _selector = $(_selector);

  if (_selector.length === 0) {
    return;
  }
  //console.log(_selector);
  //return;

  var reader = new FileReader();
  var _result;

  var _file_name = evt.target.files[0].name;

  reader.onload = function (evt) {
    if (evt.target.readyState !== 2)
      return;
    if (evt.target.error) {
      alert('Error while reading file');
      return;
    }

    //filecontent = evt.target.result;

    //document.forms['myform'].elements['text'].value = evt.target.result;
    _result = evt.target.result;

    _process_file(_result, function (_result) {
      _selector.val(_result);
      _selector.change();
      $(_file_input).val("");
    });
  };

//    var _pos = _file_name.lastIndexOf(".");
//    _file_name = _file_name.substr(0, _pos)
//        + _output_filename_surffix
//        + _file_name.substring(_pos, _file_name.length);

  //console.log(_file_name);

  reader.readAsText(evt.target.files[0]);
};

var _load_textarea = function (evt) {
  var _panel = $(".file-process-framework");

  // --------------------------

  var _result = _panel.find(".input-mode.textarea").val();
  if (_result.trim() === "") {
    return;
  }

  // ---------------------------

  _panel.find(".loading").removeClass("hide");

  // ---------------------------
  var d = new Date();
  var utc = d.getTime() - (d.getTimezoneOffset() * 60000);

  var local = new Date(utc);
  var _file_name = local.toJSON().slice(0, 19).replace(/:/g, "-");
  _file_name = "output_" + _file_name + ".txt";

  // ---------------------------

  _process_file(_result, function (_result) {
    _panel.find(".preview").val(_result);
    _panel.find(".filename").val(_file_name);

    _panel.find(".loading").addClass("hide");
    _panel.find(".display-result").show();
    _panel.find(".display-result .encoding").hide();

    var _auto_download = (_panel.find('[name="autodownload"]:checked').length === 1);
    if (_auto_download === true) {
      _panel.find(".download-file").click();
    }
  });
};

var _download_file_button = function () {
  var _panel = $(".file-process-framework");

  var _file_name = _panel.find(".filename").val();
  var _data = _panel.find(".preview").val();

  _download_file(_data, _file_name, "txt");
};


var _download_file = function (data, filename, type) {
  var a = document.createElement("a"),
          file = new Blob([data], {type: type});
  if (window.navigator.msSaveOrOpenBlob) // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else { // Others
    var url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

};

var pearsonCorrelation = function (_ary1, _ary2) {
  var _avg1 = _calc_avg(_ary1);
  var _avg2 = _calc_avg(_ary2);

  //console.log([_avg1, _avg2]);

  var _a = 0;
  var _b1 = 0;
  var _b2 = 0;
  for (var _i = 0; _i < _ary1.length; _i++) {
    var _x = (_ary1[_i] - _avg1);
    var _y = (_ary2[_i] - _avg2);
    _a += _x * _y;
    _b1 += _x * _x;
    _b2 += _y * _y;
  }

  if (_b1 * _b2 === 0) {
    return 0;
  }
  return _a / (Math.sqrt(_b1) * Math.sqrt(_b2));
};

var _calc_avg = function (_ary) {
  if (_ary.length === 0) {
    return;
  }
  var _sum = 0;
  for (var _i = 0; _i < _ary.length; _i++) {
    _sum += _ary[_i];
  }
  return (_sum / _ary.length);
};

var _calc_stdev = function (_ary) {
  if (_ary.length === 0) {
    return;
  }
  var _avg = _calc_avg(_ary);
  var _var = 0;

  for (var _i = 0; _i < _ary.length; _i++) {
    var _a = (_ary[_i] - _avg);
    _var += _a * _a;
  }
  return Math.sqrt(_var / (_ary.length - 1));
};

/**
 * https://gist.github.com/ronaldsmartin/47f5239ab1834c47088e
 * @returns {undefined}
 */
/*
 var _load_google_spreadsheet = function () {
 var _url = this.value.trim();
 
 if (_url.indexOf('https://docs.google.com/spreadsheets/d/') !== 0
 || _url.indexOf('/edit?usp=sharing') === -1) {
 return;
 }
 
 var _id = _url.substring(('https://docs.google.com/spreadsheets/d/').length, _url.length - ('/edit?usp=sharing').length);
 
 var _input = this;
 var _selector = $(_input).data("file-to-textarea");
 _selector = $(_selector);
 
 var _sheet = $(_input).data("sheet-selector");
 _sheet = $(_sheet).val().trim();
 
 if (_sheet === "") {
 return;
 }
 
 //var _json_url = 'https://spreadsheets.google.com/feeds/list/' + _id + '/od6/public/values?alt=json-in-script&callback=?';
 var _json_url = "https://script.google.com/macros/s/AKfycbzGvKKUIaqsMuCj7-A2YRhR-f7GZjl4kSxSN1YyLkS01_CfiyE/exec?id=" + _id + '&sheet=' + _sheet + '&callback=?';
 //console.log(_json_url);
 $.getJSON(_json_url, function (_data) {
 _data = _data["records"];
 var _text = [];
 var _attr_list = [];
 
 //console.log(_data);
 for (var _i = 0; _i < _data.length; _i++) {
 var _line = [];
 for (var _attr in _data[_i]) {
 if (_i === 0) {
 _attr_list.push(_attr);
 }
 
 var _value = _data[_i][_attr];
 //console.log(_value);
 _line.push(_value);
 }
 _text.push(_line.join(','));
 }
 
 _text = _attr_list.join(",") + "\n" + _text.join("\n");
 //console.log(_text);
 
 // ----------------------------
 
 _selector.val(_text).change();
 
 //console.log(_data);
 });
 
 // https://script.google.com/macros/s/AKfycbzGvKKUIaqsMuCj7-A2YRhR-f7GZjl4kSxSN1YyLkS01_CfiyE/exec
 
 //console.log(_id);
 };
 */
var _load_google_spreadsheet = function () {
  var _url = this.value.trim();

  if (_url.indexOf('https://docs.google.com/spreadsheets/d/') !== 0
          || _url.indexOf('/pubhtml') === -1) {
    return;
  }

  // https://docs.google.com/spreadsheets/d/1KL07qS2txPpnZSvLt0gBWJ2_lGsVTr51s5JkE4bg2tY/pubhtml?gid=539063364&single=true

  // https://docs.google.com/spreadsheets/d/1zwOPqpkcX2YRDEXLQEd2eM8OVz24FEXT5WT5eFP6ZsA/pubhtml
  // https://docs.google.com/spreadsheets/d/1zwOPqpkcX2YRDEXLQEd2eM8OVz24FEXT5WT5eFP6ZsA/pubhtml
  // https://docs.google.com/spreadsheets/d/1zwOPqpkcX2YRDEXLQEd2eM8OVz24FEXT5WT5eFP6ZsA/pubhtml?gid=1213777536&single=true
  // 
  // https://docs.google.com/spreadsheets/d/0AtMEoZDi5-pedElCS1lrVnp0Yk1vbFdPaUlOc3F3a2c/pubhtml
  // 
  // https://spreadsheets.google.com/feeds/list/1zwOPqpkcX2YRDEXLQEd2eM8OVz24FEXT5WT5eFP6ZsA/data/public/values?alt=json-in-script&gid=1213777536&callback=a&

  // https://spreadsheets.google.com/feeds/list/0AtMEoZDi5-pedElCS1lrVnp0Yk1vbFdPaUlOc3F3a2c/od6/public/values?alt=json-in-script&callback=a

  // https://spreadsheets.google.com/feeds/list/1zwOPqpkcX2YRDEXLQEd2eM8OVz24FEXT5WT5eFP6ZsA/od6/public/values?alt=json&gid=1213777536&callback=a


  // https://docs.google.com/spreadsheets/d/1zwOPqpkcX2YRDEXLQEd2eM8OVz24FEXT5WT5eFP6ZsA/pub?gid=1213777536&single=true&output=csv
  // https://spreadsheets.google.com/feeds/list/1zwOPqpkcX2YRDEXLQEd2eM8OVz24FEXT5WT5eFP6ZsA/1/public/values?alt=json&gid=1213777536&callback=a

  // https://docs.google.com/spreadsheets/d/1zwOPqpkcX2YRDEXLQEd2eM8OVz24FEXT5WT5eFP6ZsA/pubhtml

  var _id = _url.substring(('https://docs.google.com/spreadsheets/d/').length, _url.length - ('/pubhtml').length);
  console.log(_id);

  var _input = this;
  var _selector = $(_input).data("file-to-textarea");
  _selector = $(_selector);

  //var _json_url = 'https://spreadsheets.google.com/feeds/list/' + _id + '/od6/public/values?alt=json-in-script&callback=?';
  var _json_url = 'https://spreadsheets.google.com/feeds/list/' + _id + '/1/public/values?alt=json-in-script&gid=1213777536&callback=?';
  //console.log(_json_url);
  $.getJSON(_json_url, function (_data) {
    _data = _data.feed.entry;
    var _text = [];
    var _attr_list = [];

    //console.log(_data);
    for (var _i = 0; _i < _data.length; _i++) {
      var _line = _data[_i].content.$t.split(", ");
      for (var _j = 0; _j < _line.length; _j++) {
        var _t = _line[_j].split(": ");
        var _attr = _t[0];
        var _value = _t[1];

        if (_i === 0) {
          _attr_list.push(_attr);
        }
        _line[_j] = _value;
      }
      _text.push(_line.join(','));
    }

    _text = _attr_list.join(",") + "\n" + _text.join("\n");
    console.log(_text);

    // ----------------------------

    _selector.val(_text).change();

    //console.log(_data);
  });

  // https://script.google.com/macros/s/AKfycbzGvKKUIaqsMuCj7-A2YRhR-f7GZjl4kSxSN1YyLkS01_CfiyE/exec

  //console.log(_id);
};

var _load_data = function (_selector, _file_path, _callback) {
  $.get(_file_path, function (_data) {
    $(_selector).val(_data);
    _callback();
  });
};

var _change_tirgger_input = function () {
  var _selector = $(this).data("trigger-selector");
  $(_selector).change();
};

$(function () {
  $('.menu .item').tab();
  var _panel = $(".file-process-framework");
  //_panel.find(".input-mode.textarea").click(_load_textarea).keyup(_load_textarea);

  _panel.find(".download-file").click(_download_file_button);
  _panel.find(".change-trigger").change(_combine_input);
  _panel.find(".change-trigger-draw").change(_draw_result_table);
  _panel.find(".key-up-trigger").keyup(_combine_input);

  _panel.find(".focus_select").focus(function () {
    $(this).select();
  });

  _panel.find(".file-change-trigger").change(_load_file);
  _panel.find(".google-spreadsheet-trigger")
          .change(_load_google_spreadsheet)
  //.change();
  _panel.find(".change-trigger-input").change(_change_tirgger_input);

  //$('.menu .item').tab();

  if (location.href.indexOf("?ai=t") === -1) {
    _load_data("#input_data", "data/data.csv", _combine_input);
  } else {
    $("button.mode:first").click();
    _load_data("#input_data", "data/data2.csv", _combine_input);
  }


  $('#copy_source_code').click(function () {
    PULI_UTIL.clipboard.copy($("#preview").val());
  });

  $('#copy_source_code_html').click(function () {
    PULI_UTIL.clipboard.copy($("#preview_html_source").val());
  });

  $(".sortable").sortable({
    beforeStop: function () {
      _draw_result_table();
    }
  });
  $(".sortable").disableSelection();
});
