
var _test_of_trend_cox_stuart = function (_array) {
    //_array = [201,206,223,235,264,237,217,188,204,182];
    //_array = [206,223,235,264,237,217,188,204,182,230,223,227,242,238,207,201,225,243,215,260,228,214,215,260,225,240,239,226,260,248];
    //_array = [206,223,235,264,237,217,188,204,182,230,223,227,242,238,207,271,275,283,295,260,228,214,215,260,225,240,239,226,260,248];
    
    var _output = {};
    
    var _draw_table = (typeof($) === "function");
    
    if (_draw_table) {
        _output["table"] = $('<div style="display:inline-block;" class="analyze-result">'
            + '<div class="caption" style="text-align:center;display:block">Cox-Stuart趨勢分析</div>'
            + '<table border="1" cellpadding="0" cellspacing="0" >'
            + '<thead>'
                + '<tr class="pair-a"><th rowspan="2" class="right-border-none">Pair</th></tr>'
                + '<tr class="pair-b"></tr>'
            + '</thead>'
            + '<tbody>'
                + '<tr class="pair-a"><th valign="bottom" rowspan="2" class="right-border-none">-)</th></tr>'
                + '<tr class="pair-b"></tr>'
            + '</tbody>'
            + '<tfoot><tr><th class="right-border-none">Sign</th></tr></tfoot>'
            + '</table></div>');
        var _thead_pair_a = _output["table"].find("thead tr.pair-a");
        var _thead_pair_b = _output["table"].find("thead tr.pair-b");
        var _tbody_pair_a = _output["table"].find("tbody tr.pair-a");
        var _tbody_pair_b = _output["table"].find("tbody tr.pair-b");
        var _tfoot_sign = _output["table"].find("tfoot tr");
    }
    
    var _m = parseInt(_array.length / 2, 10);
    
    var _pair_result = [];
    var _minus_count = 0;
    for (var _i = 0; _i < _m; _i++) {
        var _a = _array[_i];
        var _b = _array[(_i+_m)];
        var _sign = (_a < _b);
        if (_sign === true) {
            _minus_count++;
        }
        _pair_result.push((_a < _b));
        
        if (_draw_table === true) {
            _thead_pair_a.append('<th align="center" class="left-border-none right-border-none bottom-border-none" >x<sub>' + (_i+1) + '</sub></th>');
            _thead_pair_b.append('<th align="center" class="left-border-none right-border-none top-border-none">x<sub>' + (_i+_m+1) + '</sub></th>');
            _tbody_pair_a.append('<td align="right" class="left-border-none right-border-none">' + _a + '</td>');
            _tbody_pair_b.append('<td align="right" class="left-border-none right-border-none">' + _b + '</td>');
            if (_sign === true) {
                _tfoot_sign.append('<td align="center" class="left-border-none right-border-none">' + "-" + '</td>');
            }
            else {
                _tfoot_sign.append('<td align="center" class="left-border-none right-border-none">' + "+" + '</td>');
            }
            
        }
    }
    var _plus_count = _m - _minus_count;
    
    //console.log({
    //    "m": _m,
    //    "minus": _minus_count
    //});
    
    var _is_sig = false;
    
    var _test_method = "P";
    var _test_result;
    if (_m < 10) {
        var _p = 0;
        for (var _i = 0; _i < _minus_count+1; _i++) {
            var _im = _i * _m;
            if (_im === 0) {
                _im = 1;
            }
            var _a = ((_im) * Math.pow(0.5, _m));
            //console.log(_a);
            _p = _p + _a;
        }
        //console.log(_p);
        
        if (_p < 0.025) {
            _is_sig = true;
        }
        _test_result = _p;
    }
    else {
        _test_method = "Z";
        var _part1 = Math.abs(_plus_count - (_m/2)) - 0.5;
        var _part2 = Math.sqrt(_m / 4);
        var _z = _part1 / _part2;
        //console.log(_z);
        if (_z > 1.96) {
            _is_sig = true;
        }
        _test_result = _z;
    }
    
    _output["is_sig"] = _is_sig;
    _output["is_growth"] = (_minus_count > _plus_count);
    _output["test_method"] = _test_method;
    _output["test_result"] = _test_result;
    
    return _output;
};

//var _r = _test_of_trend_cox_stuart();
//$(function () {
//    $("body").append(_r.table);
//})