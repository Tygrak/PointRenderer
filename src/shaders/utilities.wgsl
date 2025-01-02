//rewritten from https://github.com/kbinani/colormap-shaders/tree/master/shaders/glsl to wgsl
fn hsv2rgb(h: f32, s: f32, v: f32) -> vec4<f32> {
	var r = v;
	var g = v;
	var b = v;
	if (s > 0.0) {
		let i = i32(h*6.0);
		let f = h*6.0 - f32(i);
		if (i == 1) {
            r *= 1.0 - s * f;
            b *= 1.0 - s;
		} else if (i == 2) {
			r *= 1.0 - s;
			b *= 1.0 - s * (1.0 - f);
		} else if (i == 3) {
			r *= 1.0 - s;
			g *= 1.0 - s * f;
		} else if (i == 4) {
			r *= 1.0 - s * (1.0 - f);
			g *= 1.0 - s;
		} else if (i == 5) {
			g *= 1.0 - s;
			b *= 1.0 - s * f;
		} else {
			g *= 1.0 - s * (1.0 - f);
			b *= 1.0 - s;
		}
	}
	return vec4(r, g, b, 1.0);
}

//IDL_Haze
fn colormap_haze_red(x: f32) -> f32 {
    if (x < 0.0) {
        return 167.0;
    } else if (x < (2.54491177159840E+02 + 2.49117061281287E+02) / (1.94999353031535E+00 + 1.94987400471999E+00)) {
        return -1.94987400471999E+00 * x + 2.54491177159840E+02;
    } else if (x <= 255.0) {
        return 1.94999353031535E+00 * x - 2.49117061281287E+02;
    } else {
        return 251.0;
    }
}

fn colormap_haze_green(x: f32) -> f32 {
    if (x < 0.0) {
        return 112.0;
    } else if (x < (2.13852573128775E+02 + 1.42633630462899E+02) / (1.31530121382008E+00 + 1.39181683887691E+00)) {
        return -1.39181683887691E+00 * x + 2.13852573128775E+02;
    } else if (x <= 255.0) {
        return 1.31530121382008E+00 * x - 1.42633630462899E+02;
    } else {
        return 195.0;
    }
}

fn colormap_haze_blue(x: f32) -> f32 {
    if (x < 0.0) {
        return 255.0;
    } else if (x <= 255.0) {
        return -9.84241021836929E-01 * x + 2.52502692064968E+02;
    } else {
        return 0.0;
    }
}

fn colormap_haze(x: f32) -> vec4<f32> {
    let t = x * 255.0;
    let r = colormap_haze_red(t) / 255.0;
    let g = colormap_haze_green(t) / 255.0;
    let b = colormap_haze_blue(t) / 255.0;
    return vec4(r, g, b, 1.0);
}

//transform_hot_metal modified for higher range
fn colormap_hotmetal_red(x: f32) -> f32 {
    if (x < 0.0) {
        return 0.0;
    } else if (x <= 0.57147) {
        return 446.22 * x / 255.0;
    } else {
       return 1.0;
    }
}

fn colormap_hotmetal_green(x: f32) -> f32 {
	if (x < 2.5) {
		if (x < 0.6) {
			return 0.0;
		} else if (x <= 0.95) {
			return ((x - 0.6) * 728.57) / 255.0;
		} else {
			return 1.0;
		}
	} else {
		return (4.0-x)/1.5;
	}
}

fn colormap_hotmetal_blue(x: f32) -> f32 {
    if (x > 0) {
        return 0.05;
    } else if (x > 1) {
        return 0.05+(x-1)/3;
    }
    return 0.0;
}

fn colormap_hotmetal(x: f32) -> vec4<f32> {
    return vec4(colormap_hotmetal_red(min(x, 1)), colormap_hotmetal_green(x), colormap_hotmetal_blue(x), 1.0);
}

//IDL_Eos_B
fn colormap_eosb_h(x: f32) -> f32 {
	if (x < 0.1167535483837128) {
		return 2.0 / 3.0; // H1
	} else if (x < 0.1767823398113251) {
		return ((-3.19659402385354E+02 * x + 1.14469539590179E+02) * x - 1.52210982227697E+01) * x + 1.39214703883044E+00; // H2
	} else if (x < 0.2266354262828827) {
		return ((-3.55166097640991E+02 * x + 2.51218596935272E+02) * x - 6.08853752315044E+01) * x + 5.38727123476564E+00; // H3
	} else if (x < (6.95053970124612E-01 - 4.13725796136428E-01) / (1.48914458632691E+00 - 6.97458630656247E-01)) {
		return -1.48914458632691E+00 * x + 6.95053970124612E-01; // H4
	} else if (x < (4.13725796136428E-01 - 2.48329223043123E-01) / (6.97458630656247E-01 - 3.48617475202321E-01)) {
		return -6.97458630656247E-01 * x + 4.13725796136428E-01; // H5
	} else {
		return -3.48617475202321E-01 * x + 2.48329223043123E-01; // H6
	}
}

fn colormap_eosb_v(x: f32) -> f32 {
	var v = 1.0;
	if (x < 0.115834504365921) {
		v = 4.18575376272140E+00 * x + 5.15145240089963E-01; // V1-Hi
	} else if (x < (1.90980360972022E+00 + 9.13724751363001E-01) / (7.87450639585523E+00 + 7.87450803534638E+00)) {
		v = -7.87450803534638E+00 * x + 1.90980360972022E+00; // V2-Hi
	} else if (x < 0.5) {
		v = 7.87450639585523E+00 * x - 9.13724751363001E-01; // V3-Hi
	} else {
		v = -1.87540494049556E+00 * x + 2.33603077812338E+00; // V4-Hi
	}
	v = clamp(v, 0.0, 1.0);

	let period = 4.0 / 105.0;
	let len = 3.0 / 252.0;
	let t = (x + 7.0 / 252.0)%period;
	if (0.0 <= t && t < len) {
		if (x < 0.115834504365921) {
			v = 3.74113124408467E+00 * x + 4.64654322955584E-01; // V1-Lo
		} else if (x < (1.90980360972022E+00 + 9.13724751363001E-01) / (7.87450639585523E+00 + 7.87450803534638E+00)) {
			v = -3.97326878048783E+00 * x + 1.25308500609757E+00; // V2-Lo
		} else if (x < 0.25) {
			v = 6.99297032967038E+00 * x - 8.03946549450558E-01; // V3-Lo
		} else if (x < 0.72) {
			v -= 26.0 / 255.0;
		} else {
			v = -1.67870020621040E+00 * x + 2.09414636280895E+00; // V4-Lo
		}
	}

	return v;
}

fn colormap_eosb(x: f32) -> vec4<f32> {
	let h = colormap_eosb_h(clamp(x, 0.0, 1.0));
	let s = 1.0;
	let v = colormap_eosb_v(clamp(x, 0.0, 1.0));
	return hsv2rgb(h, s, v);
}

//IDL_Red_Temperature
fn colormap_temperature_red(x: f32) -> f32 {
    return 1.448953446096850 * x - 5.02253539008443e-1;
}

fn colormap_temperature_green(x: f32) -> f32 {
    return 1.889376646180860 * x - 2.272028094820020e2;
}

fn colormap_temperature_blue(x: f32) -> f32 {
    return 3.92613636363636 * x - 7.46528409090909e+2;
}

fn colormap_temperature(x: f32) -> vec4<f32> {
    let t = x * 255.0;
    let r = clamp(colormap_temperature_red(t) / 255.0, 0.0, 1.0);
    let g = clamp(colormap_temperature_green(t) / 255.0, 0.0, 1.0);
    let b = clamp(colormap_temperature_blue(t) / 255.0, 0.0, 1.0);
    return vec4(r, g, b, 1.0);
}

//IDL_CB-Spectral
fn colormap_spectral_red(x: f32) -> f32 {
	if (x < 0.09752005946586478) {
		return 5.63203907203907E+02 * x + 1.57952380952381E+02;
	} else if (x < 0.2005235116443438) {
		return 3.02650769230760E+02 * x + 1.83361538461540E+02;
	} else if (x < 0.2974133397506856) {
		return 9.21045429665647E+01 * x + 2.25581007115501E+02;
	} else if (x < 0.5003919130598823) {
		return 9.84288115246108E+00 * x + 2.50046722689075E+02;
	} else if (x < 0.5989021956920624) {
		return -2.48619704433547E+02 * x + 3.79379310344861E+02;
	} else if (x < 0.902860552072525) {
		return ((2.76764884219295E+03 * x - 6.08393126459837E+03) * x + 3.80008072407485E+03) * x - 4.57725185424742E+02;
	} else {
		return 4.27603478260530E+02 * x - 3.35293188405479E+02;
	}
}

fn colormap_spectral_green(x: f32) -> f32 {
	if (x < 0.09785836420571035) {
		return 6.23754529914529E+02 * x + 7.26495726495790E-01;
	} else if (x < 0.2034012006283468) {
		return 4.60453201970444E+02 * x + 1.67068965517242E+01;
	} else if (x < 0.302409765476316) {
		return 6.61789401709441E+02 * x - 2.42451282051364E+01;
	} else if (x < 0.4005965758690823) {
		return 4.82379130434784E+02 * x + 3.00102898550747E+01;
	} else if (x < 0.4981907026473237) {
		return 3.24710622710631E+02 * x + 9.31717541717582E+01;
	} else if (x < 0.6064345916502067) {
		return -9.64699507389807E+01 * x + 3.03000000000023E+02;
	} else if (x < 0.7987472620841592) {
		return -2.54022986425337E+02 * x + 3.98545610859729E+02;
	} else {
		return -5.71281628959223E+02 * x + 6.51955082956207E+02;
	}
}

fn colormap_spectral_blue(x: f32) -> f32 {
	if (x < 0.0997359608740309) {
		return 1.26522393162393E+02 * x + 6.65042735042735E+01;
	} else if (x < 0.1983790695667267) {
		return -1.22037851037851E+02 * x + 9.12946682946686E+01;
	} else if (x < 0.4997643530368805) {
		return (5.39336225400169E+02 * x + 3.55461986381562E+01) * x + 3.88081126069087E+01;
	} else if (x < 0.6025972254407099) {
		return -3.79294261294313E+02 * x + 3.80837606837633E+02;
	} else if (x < 0.6990141388105746) {
		return 1.15990231990252E+02 * x + 8.23805453805459E+01;
	} else if (x < 0.8032653181119567) {
		return 1.68464957265204E+01 * x + 1.51683418803401E+02;
	} else if (x < 0.9035796343050095) {
		return 2.40199023199020E+02 * x - 2.77279202279061E+01;
	} else {
		return -2.78813846153774E+02 * x + 4.41241538461485E+02;
	}
}

fn colormap_spectral(x: f32) -> vec4<f32> {
	let r = clamp(colormap_spectral_red(x) / 255.0, 0.0, 1.0);
	let g = clamp(colormap_spectral_green(x) / 255.0, 0.0, 1.0);
	let b = clamp(colormap_spectral_blue(x) / 255.0, 0.0, 1.0);
	return vec4(r, g, b, 1.0);
}

//modified IDL_Green-White_Linear
fn colormap_greenwhite_red(x: f32) -> f32 {
    return 1.61361058036781E+00 * x - 1.55391688559828E+02;
}

fn colormap_greenwhite_green(x: f32) -> f32 {
    return 9.99817607003891E-01 * x + 1.01544260700389E+00;
}

fn colormap_greenwhite_blue(x: f32) -> f32 {
    return 3.44167852062589E+00 * x - 6.19885917496444E+02;
}

fn colormap_greenwhite(x: f32) -> vec4<f32> {
    let t = x * 255.0;
    let r = clamp(colormap_greenwhite_red(t) / 255.0, 0.0, 1.0);
    let g = clamp(colormap_greenwhite_green(t) / 255.0, 0.0, 1.0);
    let b = clamp(colormap_greenwhite_blue(t) / 255.0, 0.0, 1.0);
    return vec4(g, r, b, 1.0);
}

//transform_supernova
fn colormap_supernova_f1(x: f32) -> f32 {
    return (0.3647 * x + 164.02) * x + 154.21;
}

fn colormap_supernova_f2(x: f32) -> f32 {
    return (126.68 * x + 114.35) * x + 0.1551;
}

fn colormap_supernova_red(x: f32) -> f32 {
    if (x < 0.0) {
        return 0.0;
    } else if (x < 0.136721748106749) {
        return colormap_supernova_f2(x) / 255.0;
    } else if (x < 0.23422409711017) {
        return (1789.6 * x - 226.52) / 255.0;
    } else if (x < 0.498842730309711) {
        return colormap_supernova_f1(x) / 255.0;
    } else if (x < 0.549121259378134) {
        return (-654.951781800243 * x + 562.838873112072) / 255.0;
    } else if (x < 1.0) {
        return ((3.6897 * x + 11.125) * x + 223.15) / 255.0;
    } else {
        return 237.0 / 255.0;
    }
}

fn colormap_supernova_green(x: f32) -> f32 {
    if (x < 0.0) {
        return 154.0 / 255.0;
    } else if (x < 3.888853260731947e-2) {
        return colormap_supernova_f1(x) / 255.0;
    } else if (x < 0.136721748106749e0) {
        return (-1455.86353067466 * x + 217.205447330541) / 255.0;
    } else if (x < 0.330799131955394) {
        return colormap_supernova_f2(x) / 255.0;
    } else if (x < 0.498842730309711) {
        return (1096.6 * x - 310.91) / 255.0;
    } else if (x < 0.549121259378134) {
        return colormap_supernova_f1(x) / 255.0;
    } else {
        return 244.0 / 255.0;
    }
}

fn colormap_supernova_blue(x: f32) -> f32 {
    if (x < 0.0) {
        return 93.0 / 255.0;
    } else if (x < 3.888853260731947e-2) {
        return (1734.6 * x + 93.133) / 255.0;
    } else if (x < 0.234224097110170) {
        return colormap_supernova_f1(x) / 255.0;
    } else if (x < 0.330799131955394) {
        return (-1457.96598791534 * x + 534.138211325166) / 255.0;
    } else if (x < 0.549121259378134) {
        return colormap_supernova_f2(x) / 255.0;
    } else if (x < 1.0) {
        return ((3.8931 * x + 176.32) * x + 3.1505) / 255.0;
    } else {
        return 183.0 / 255.0;
    }
}

fn colormap_supernova(x: f32) -> vec4<f32> {
    return vec4(colormap_supernova_red(x), colormap_supernova_green(x), colormap_supernova_blue(x), 1.0);
}

fn getRandomColor(a: f32) -> vec4<f32> {
    //let randomNumber = (6.28*sin(1984.142069*a+69.345)) % 6.28;
    let randomNumber = 6.28*fract(sin(dot(vec2(a, a%3), vec2(12.9898, 78.233))) * 43758.5453);
    let r = abs(sin(randomNumber))+0.15;
    let g = saturate(abs(cos(randomNumber*6.0))/1.5+0.01+(a%13)/39);
    let b = abs(1-r-(a%50)/100);
    let color = vec3(r-g/10, g, b);
    return vec4(color, 1.0);
}

//based on https://iquilezles.org/articles/palettes/
fn getPaletteColor(x: f32) -> vec4<f32> {
    let t = ((x%10)/10)*0.7+((x%50)/50)*0.2+((x%200)/200)*0.1;
    let a = vec3(0.5, 0.5, 0.5);				
    let b = vec3(0.5, 0.5, 0.5);
    let c = vec3(1.0, 1.0, 1.0);
    let d = vec3(0.00, 0.33, 0.67);
    return vec4(a + b*cos(6.28318*(c*t+d)), 1.0);
}







fn debugModeIterations(iteration: i32, maxIterations: i32) -> vec4<f32> {
	return colormap_hotmetal(f32(iteration)/f32(maxIterations));
}

fn debugModeOctree(numRaySphereIntersections: i32, totalAtoms: f32) -> vec4<f32> {
	return colormap_haze(f32(numRaySphereIntersections)/(drawSettings.totalAtoms/16))/2+colormap_haze(f32(numRaySphereIntersections)/400)/2;
}

fn debugModeOctree2(numIntersected: i32, iteration: i32, maxIterations: i32) -> vec4<f32> {
	var rAdd = 0.0;
	if (iteration > 0) {
		rAdd = 0.2;
	}
	return colormap_spectral(f32(numIntersected)/150);
}

fn debugModeOctree3(numRaySphereIntersections: i32, numIntersected: i32, intersecting: i32) -> vec4<f32> {
	var iAdd = vec4(0.0, 0.0, 0.0, 0.0);
	if (intersecting >= 0) {
		iAdd = vec4(-0.05, -0.05, 0.1, 0.0);
	}
	return colormap_haze(f32(numRaySphereIntersections)/(400))/2+colormap_spectral(f32(numIntersected)/100)/2+iAdd;
}

fn debugModeDebug(numRaySphereIntersections: i32, numIntersected: i32, intersecting: i32, stackPos: i32, resultColor: vec4<f32>, iteration: i32, closestRealHitT: f32) -> vec4<f32> {
	var iAdd = vec4(0.0, 0.0, 0.0, 0.0);
	if (intersecting >= 0) {
		iAdd = vec4(-0.05, -0.05, 0.1, 0.0);
	}
	var realHitAdd = vec4(0.0, 0.0, 0.0, 0.0);
	if (closestRealHitT >= 50000) {
		realHitAdd = vec4(0.25, -0.05, -0.45, 0.0);
	}
	var cOct = vec4(0, (colormap_haze(f32(numRaySphereIntersections)/(400))/4+colormap_spectral(f32(numIntersected)/100)/4).g, 0, 0);
	return resultColor+vec4(0.5, 0, 0, 0)*(f32(stackPos)/8)+vec4(0, 0.3, 0, 0)*(f32(iteration)/100)+cOct+iAdd+realHitAdd;
}

fn debugModeDepth(maxDistance: f32) -> vec4<f32> {
	let farDistance = 400.0;
	if (maxDistance < farDistance) {
		return colormap_eosb(maxDistance/farDistance);
	} else {
		return colormap_eosb(min(maxDistance/farDistance, 1))*(1-(maxDistance-farDistance)/(farDistance*3));
	}
}

fn debugModeNormals(normal: vec3<f32>) -> vec4<f32> {
	return vec4(normal, 1.0);
}

fn debugModeSteps(stackPos: i32, stackSize: i32) -> vec4<f32> {
	return colormap_supernova(f32(stackPos+1)/f32(stackSize));
}

fn debugModeHideStackPos(resultColor: vec4<f32>, stackPos: i32, toHide: i32, distanceFade: f32) -> vec4<f32> {
	var color = resultColor*distanceFade;
	if (stackPos == toHide) {
		color = vec4(-10.25, -10.05, -10.25, 1.0);
    }
    return color;
}

fn debugModeTEnd(t: f32, end: f32) -> vec4<f32> {
	return colormap_temperature(t/end);
}

fn debugModeRaymarchedAtoms(raymarchedAtoms: f32) -> vec4<f32> {
	return colormap_greenwhite(raymarchedAtoms/150.0);
}

fn debugModeBright(resultColor: vec4<f32>, distanceFade: f32) -> vec4<f32> {
	return (vec4(abs(0.5-resultColor.x), abs(0.5-resultColor.y), abs(0.5-resultColor.z), 1.0))*(distanceFade);
}

fn debugModeDefaultWithBase(resultColor: vec4<f32>, distanceFade: f32, closestRealHitT: f32, baseAtomColor: vec4<f32>, dist: f32) -> vec4<f32> {
	if (closestRealHitT < 50000) {
		return mix(resultColor*distanceFade, resultColor*distanceFade*0.25+baseAtomColor*distanceFade, 1-clamp(abs(closestRealHitT-dist)/3, 0, 1));
	}
	return resultColor*distanceFade;
}

fn debugModeFakeTransparency(resultColor: vec4<f32>, distanceFade: f32, dist: f32, initStart: vec3<f32>, rayDirection: vec3<f32>) -> vec4<f32> {
	var accumDist = 1.0;
	var last = dist;
	for (var i : i32 = 0; i < stackSize; i++) {
		if (stackT[i]+2 < dist) {
			continue;
		}
		if (stackT[i] > 50000) {
			break;
		}
		let intersectionEnd = aabbIntersection(initStart, rayDirection, 1.0/rayDirection, bins.bins[stackBins[i]].min, bins.bins[stackBins[i]].max);
    	let d = intersectionEnd.y-last;
		let binSize = bins.bins[stackBins[i]].max-bins.bins[stackBins[i]].min;
		let binSizeLargest = max(binSize.x, max(binSize.y, binSize.z));
		if (d > 0) {
			if (d < binSizeLargest*4) {
				accumDist += d;
			} else {
				accumDist += binSizeLargest;
			}
		}
		last = stackT[i];
	}
	//let binSize = bins.bins[stackBins[i]].max-bins.bins[stackBins[i]].min;
	//let size = max(binSize.x, max(binSize.y, binSize.z));
    //let intersectionEnd = aabbIntersection(origin, direction, inverseDirection, bins.bins[stackBins[0]].min, bins.bins[stackBins[0]].max);
    //end = intersectionEnd.y-stackT[0];
	return resultColor*distanceFade*((accumDist/25)*mix(0.5, 1.5, drawSettings.debugA)+0.1);
}

fn debugModeFakeTransparency2(resultColor: vec4<f32>, distanceFade: f32, dist: f32, initStart: vec3<f32>, rayDirection: vec3<f32>) -> vec4<f32> {
	if (resultColor.r+resultColor.g+resultColor.b < 0.5) {
		return resultColor;
	}
	var accumDist = 1.0;
	var last = dist;
	for (var i : i32 = 0; i < stackSize; i++) {
		if (stackT[i]+2 < dist) {
			continue;
		}
		if (stackT[i] > 50000) {
			break;
		}
		let intersectionEnd = aabbIntersection(initStart, rayDirection, 1.0/rayDirection, bins.bins[stackBins[i]].min, bins.bins[stackBins[i]].max);
    	let d = intersectionEnd.y-last;
		let binSize = bins.bins[stackBins[i]].max-bins.bins[stackBins[i]].min;
		let binSizeLargest = max(binSize.x, max(binSize.y, binSize.z));
		if (d > 0) {
			if (d < binSizeLargest*4) {
				accumDist += d;
			} else {
				accumDist += binSizeLargest;
			}
		}
		last = stackT[i];
	}
	//let binSize = bins.bins[stackBins[i]].max-bins.bins[stackBins[i]].min;
	//let size = max(binSize.x, max(binSize.y, binSize.z));
    //let intersectionEnd = aabbIntersection(origin, direction, inverseDirection, bins.bins[stackBins[0]].min, bins.bins[stackBins[0]].max);
    //end = intersectionEnd.y-stackT[0];
	return vec4(0.3, 0.2, 0.6, 1.0)*distanceFade*((accumDist/25)*mix(0.5, 1.5, drawSettings.debugA)+0.1);
}

fn debugModeSemilit(resultColor: vec4<f32>, distanceFade: f32, normal: vec3<f32>, light: vec3<f32>) -> vec4<f32> {
	let n: vec3<f32> = normalize(normal);
	let l1: vec3<f32> = normalize(light);
	var c = mix(resultColor.xyz*0.5, resultColor.xyz*1.25, (dot(n, l1)+1)/2);
	return vec4(c, 1.0)*(distanceFade);
}

fn debugModeLit(resultColor: vec4<f32>, distanceFade: f32, normal: vec3<f32>, light: vec3<f32>) -> vec4<f32> {
	let n: vec3<f32> = normalize(normal);
	let l1: vec3<f32> = normalize(light);
	var c = max(dot(n, l1), 0)*resultColor.xyz;
	return vec4(c, 1.0)*(distanceFade);
}

fn debugModeLit2(resultColor: vec4<f32>, distanceFade: f32, normal: vec3<f32>, light: vec3<f32>) -> vec4<f32> {
	let n: vec3<f32> = normalize(normal);
	let l1: vec3<f32> = normalize(light);
	let l2: vec3<f32> = normalize(vec3(-0.5, 1, 0.25));
	var c = max(dot(n, l1), 0)*vec3(0.75, 0.5, 0.5)*resultColor.xyz + max(dot(n, l2), 0)*vec3(0.5, 0.5, 0.75)*resultColor.xyz;
	return vec4(c, 1.0)*(distanceFade);
}

fn debugModeLitSpecular(resultColor: vec4<f32>, viewDirection: vec3<f32>, distanceFade: f32, normal: vec3<f32>, light: vec3<f32>) -> vec4<f32> {
	let n: vec3<f32> = normalize(normal);
	let l1: vec3<f32> = normalize(light);
	var c = max(dot(n, l1), 0)*resultColor.xyz;
	const shininess = 128;
    let halfDir = normalize(l1 - viewDirection);
	let specAngle = max(dot(halfDir, n), 0.0);
	var spec = pow(specAngle, shininess)*vec3(0.95, 0.95, 0.95);
	return vec4(c+spec, 1.0)*(distanceFade);
}

fn debugModeSemilitWithBase(resultColor: vec4<f32>, distanceFade: f32, closestRealHitT: f32, baseAtomColor: vec4<f32>, dist: f32, normal: vec3<f32>, light: vec3<f32>) -> vec4<f32> {
	let n: vec3<f32> = normalize(normal);
	let l1: vec3<f32> = normalize(light);
	var c = mix(resultColor.xyz*0.5, resultColor.xyz*1.25, (dot(n, l1)+1)/2);
	if (closestRealHitT < 50000) {
		return mix(vec4(c, 1.0)*(distanceFade), resultColor*distanceFade*0.25+baseAtomColor*distanceFade, 1-clamp(abs(closestRealHitT-dist)/3, 0, 1));
	}
	return vec4(c, 1.0)*(distanceFade);
}

fn debugModeGooch(resultColor: vec4<f32>, distanceFade: f32, normal: vec3<f32>, light: vec3<f32>) -> vec4<f32> {
	let n: vec3<f32> = normalize(normal);
	let l1: vec3<f32> = normalize(light);
	let ndotl: f32 = dot(n, l1);
	var c = mix(vec3(0.65, 0.05, 0.65), vec3(0.9, 0.9, 0.05), (ndotl+1)/2)*resultColor.xyz;
	return vec4(c, 1.0)*(distanceFade);
}



fn debugModeColormap(debugMode: f32, value: f32) -> vec4<f32> {
	if (debugMode == DM_Iterations) {
		return colormap_hotmetal(value);
	} else if (debugMode == DM_Octree1) {
		return colormap_haze(value);
	} else if (debugMode == DM_Octree2) {
		return colormap_spectral(value);
	} else if (debugMode == DM_Octree3) {
		return colormap_spectral(value)/2+colormap_haze(value)/2;
	} else if (debugMode == DM_DebugCombined) {
		return colormap_spectral(value)/4+colormap_haze(value)/4;
	} else if (debugMode == DM_StackSteps) {
		return colormap_supernova(value);
	} else if (debugMode == DM_Depth) {
		return colormap_eosb(value);
	} else if (debugMode == DM_AllStepsDistance) {
		return colormap_eosb(value);
	} else if (debugMode == DM_TToEnd) {
		return colormap_temperature(value);
	} else if (debugMode == DM_FirstStepDistance) {
		return colormap_eosb(value);
	}
	return colormap_hotmetal(value);
}
