$("#coordsBut").click(function () {

    if ($("#coordsBut").attr("class") == "showCoords") {
        $("#coordsBut").html("Hide Coords");
        $("#coordsBut").attr("class", "hideCoords");
        $("#canvasDike").toggle();
    } else {
        $("#coordsBut").html("Show Coordinates");
        $("#coordsBut").attr("class", "showCoords");
        $("#canvasDike").toggle();
    }
}); 


var canvas = $("#canvasDike");
var ctxDike = canvas.get(0).getContext("2d");

$(".coords").hover(function () {
    if ($("#coordsBut").attr("class") == "hideCoords") {
        $("#coordView").toggle();
    }
}, 
    function () {	
        if ($("#coordsBut").attr("class") == "hideCoords") {
            $("#coordView").toggle();
            ctxDike.clearRect(0, 0, 600, 600);
        }
    });

$(".coords").mousemove(function (event) {
    //get mouse page coordinates, convert to plot=canvas coordinates (subtract offset)
    var pagePosX = event.pageX //Mouse page coordinate X
    var pagePosY = event.pageY //Mouse page coordinate Y
    var offsetCan = $("#canvasDike").offset();  //Position of (0,0) of #canvas404L relative to page 
    var canPosX = pagePosX - offsetCan.left; //Mouse #canvas404L coordinate X
    var canPosY = pagePosY - offsetCan.top;  //Mouse #canvas404L coordinate Y

    let value = convertGraphPointToValue({"x": canPosX, "y": canPosY})

    let pressure = (Math.round(value["pressure"].toNumber("GPa") * 100) / 100).toFixed(2);
    let temperature = (Math.round(value["temperature"].toNumber("degC") * 100) / 100).toFixed(2);

    var coordTipText = ["Pressure: " + pressure + "Gpa",
    "Temperature: " + temperature + "°C"].join("<br>");


    //Reset the coordinate text for the current mousemove position
    $(".coordTip").html(coordTipText);

    //Draw X- and Y-cursor lines within the graph		
    ctxDike.clearRect(0, 0, 600, 600); //Clear the previous lines
    ctxDike.beginPath();
    ctxDike.moveTo(canPosX, 0);
    ctxDike.lineTo(canPosX, 600);
    ctxDike.lineWidth = 0.5;
    ctxDike.strokeStyle = "#FF0000";  //Make the lines red
    ctxDike.globalAlpha = 1.0;			//Make the line opaque
    ctxDike.stroke();
    ctxDike.beginPath();
    ctxDike.moveTo(0, canPosY);
    ctxDike.lineTo(600, canPosY);
    ctxDike.lineWidth = 0.5;
    ctxDike.stroke();
});

let q0_conductive_table = [[1, 0.473], [2, 0.334], [5, 0.212], [10, 0.150], [20, 0.106], [30, 0.086], [40, 0.075], [50, 0.067], [60, 0.063], [70, 0.059], [80, 0.056], [90, 0.053], [100, 0.051], [110, 0.049], [120, 0.047], [130, 0.045], [140, 0.044], [150, 0.043], [160, 0.042], [170, 0.041], [180, 0.041], [190, 0.040], [200, 0.040]];
let q0_hydrothermal_table = [[1, 0.240], [2, 0.172], [5, 0.114], [10, 0.086], [20, 0.069], [30, 0.063], [40, 0.060], [50, 0.058], [60, 0.059], [70, 0.059], [80, 0.056], [90, 0.053], [100, 0.051], [110, 0.049], [120, 0.047], [130, 0.045], [140, 0.044], [150, 0.043], [160, 0.042], [170, 0.041], [180, 0.041], [190, 0.040], [200, 0.040]];

function get_q0(q0_type, ageInMyr) {
    let table;

    if (q0_type == "CONDUCTIVE") {
        table = q0_conductive_table;
    } else {
        table = q0_hydrothermal_table;
    }

    for (let i = 0; i < table.length; i++) {
        let entry = table[i];

        if (entry[0] == ageInMyr) return entry[1];

        if (entry[0] > ageInMyr) {
            if (i == 0) return entry[1];
            // return average of last value and current value
            return (table[i-1][1] + entry[1])/2;
        }
    }

    return table[table.length - 1][1];
}

// sliders for:
// shear heating (0 - 100Mpa), A or B where A = constant selected by slider, B = y * P where P is pressure
// covergence rate (10-200mm/yr)
// dip of interface (5-45deg)

let shear_heating_type = "CONSTANT";
let q0_type = "CONDUCTIVE";

let t = {
    "name": "t",
    "min": 0,
    "max": 100,
    "unit": "MPa",
    "val": math.unit(0, "MPa")
};

let y = {
    "name": "y",
    "min": 0,
    "max": 0.15,
    "unit": "m/m", // math.js won't accept unitless values :) 
    "val": math.unit(0, "m/m")
};

let v = {
    "name": "v",
    "min": 10,
    "max": 200,
    "unit": "mm/year",
    "val": math.unit(10, "mm/year")
};

let delta = {
    "name": "delta",
    "min": 5,
    "max": 45,
    "unit": "deg",
    "val": math.unit(5, "deg")
};

let age = {
    "name": "age",
    "min": 1,
    "max": 200,
    "unit": "years",
    "val": math.unit(1, "years")
};

[t, y, v, delta, age].forEach(slider => {
    let number_element = document.getElementById(slider["name"] + "_number");
    number_element.min = slider["min"];
    number_element.max = slider["max"];
    number_element.value = slider["val"].toNumber(slider["unit"]);
    document.getElementById(slider["name"] + "_slider").oninput = function () {
        ratioThroughSlider = Number(this.value)
        slider["val"] = math.unit((slider["max"] - slider["min"]) * ratioThroughSlider + slider["min"], slider["unit"])
        number_element.value = (slider["max"] - slider["min"]) * ratioThroughSlider;
        graphEquationAsSVG();
    }
});

function q0RadioChange(radio) {
    q0_type = radio.value;
    graphEquationAsSVG();
}

function shearHeatingRadioChange(radio) {
    shear_heating_type = radio.value;
    if (radio.value == "CONSTANT") {
        document.getElementById("shear_heating_wrapper_constant").style.display = "block";
        document.getElementById("shear_heating_wrapper_linear").style.display = "none";
    } else {
        document.getElementById("shear_heating_wrapper_constant").style.display = "none";
        document.getElementById("shear_heating_wrapper_linear").style.display = "block";
    }
    graphEquationAsSVG();
}

let v_n = math.unit(92, "mm/year"); // trench normal convergance rate
// let q_0 = math.unit(0.0456, "W/m^2"); // heat flux of incoming lithosphere
let a = math.unit(1.8, "uW/m^3"); // radiogenic heat production in upper plate
let d = math.unit(15, "km"); // length scale for radiogenic production
let k_1 = math.unit(2.5, "W/(m K)"); // average upper plate thermal conductivity
let k_2 = math.unit(3.0, "W/(m K)"); // thermal conductivity at top of lower plate
let k = math.unit(10**-6, "m^2/s"); // thermal diffusivity
let p = math.unit(3000, "kg/m^3"); // density
let g = math.unit(9.81, "m/s^2"); // gravity

function calculateTemperatureGivenDepth(depth, pressure) {

    let q_0 = math.unit(get_q0(q0_type, age["val"].toNumber("years")), "W/m^2");
    
    let shear_heating = (shear_heating_type == "CONSTANT") ? t["val"] : math.multiply(y["val"], pressure);
    
    let square_root = math.sqrt(math.divide(math.multiply(depth, v["val"], math.sin(delta["val"])), math.multiply(math.PI, k)));

    let s = math.add(1, math.multiply(math.divide(math.multiply(2, k_2), k_1), square_root));

    let d_for_eq = math.compare(depth, d) == 1 ? d : depth;

    let numerator = math.add(math.multiply(q_0, depth), math.multiply(shear_heating, v["val"], depth), math.multiply(a, math.divide(math.multiply(d_for_eq, d_for_eq), 2)));

    let denominator = math.multiply(k_1, s);

    return math.divide(numerator, denominator);
    
};

function calculateDepthGivenPressure(pressure) {
    return math.divide(pressure, math.multiply(p, g));
}


let width = 600 // pixels
let height = 600 // pixels

let pressure_min = math.unit(0, "Pa")
let pressure_max = math.unit(1.5, "GPa")

let temperature_min = math.unit(0, "degC")
let temperature_max = math.unit(1000, "degC")


// Whole thing is a function of depth, then map depth to pressure
function calculateValuesToGraph() {
    let values = [];

    let num_steps = 100 // number of calculations to make in the line

    // iterate over the whole range of pressures
    for (
        let pressure_in_pascals = pressure_min.toNumber("Pa"); 
        pressure_in_pascals <= pressure_max.toNumber("Pa"); 
        pressure_in_pascals += (pressure_max.toNumber("Pa") - pressure_min.toNumber("Pa")) / num_steps
        ) {

        let pressure_with_units = math.unit(pressure_in_pascals, "Pa")

        values.push({
            "temperature": calculateTemperatureGivenDepth(calculateDepthGivenPressure(pressure_with_units), pressure_with_units), 
            "pressure": pressure_with_units
        })
    }

    return values;
}

function convertValueToGraphPoint(value) {
    if ((math.compare(value["temperature"], temperature_max) == 1) || (math.compare(value["pressure"], pressure_max) == 1)) {
        return null;
    }

    let x_ratio = math.divide(math.subtract(value["temperature"], temperature_min), math.subtract(temperature_max, temperature_min));
    let y_ratio = math.divide(math.subtract(value["pressure"], pressure_min), math.subtract(pressure_max, pressure_min));

    let x_pos = x_ratio * width + 75;
    let y_pos = (1 - y_ratio) * height + 50;

    return {"x": x_pos, "y": y_pos}
}

function convertGraphPointToValue(point) {
    let temperature = math.add(math.multiply((point["x"] / width), math.subtract(temperature_max, temperature_min)), temperature_min);
    let pressure = math.add(math.multiply(math.subtract(1, point["y"] / height), math.subtract(pressure_max, pressure_min)), pressure_min);

    return {"temperature": temperature, "pressure": pressure};
}

function graphEquationAsSVG() {
    var Tpoints = "";

    let values = calculateValuesToGraph();

    values.forEach(value => {
        let point = convertValueToGraphPoint(value);
        if (point != null) {
            newPoint = " " + (point["x"]) + "," + (point["y"]) + "";
            Tpoints = Tpoints.concat(newPoint);
        }
    });

    $("#T-line").attr("points", Tpoints);
}

window.onload = () => {
    graphEquationAsSVG();
}