class NumberInput {
  constructor(parent, text, value, min, max, step) {
    this.defaultValue = value
    this.min = min
    this.max = max

    this.div = document.createElement("div")
    this.div.className = "numberInput"
    this.div.textContent = text
    this.range = this.addInput("range", value, min, max, step)
    this.range.className = "numberInputRange"
    this.number = this.addInput("number", value, min, max, step)
    this.number.className = "numberInputNumber"
    parent.appendChild(this.div)

    this.range.addEventListener("input", this, false)
    this.number.addEventListener("input", this, false)
    this.onInputFunc = () => { }
  }

  handleEvent(event) {
    switch (event.type) {
      case "input":
        this.onInput(event)
        break
    }
  }

  onInput(event) {
    // console.log(event)
    var value = event.target.valueAsNumber
    if (isNaN(value)) {
      value = this.defaultValue
    }
    value = Math.max(this.min, Math.min(value, this.max))
    this.range.value = value
    this.number.value = value
    this.onInputFunc()
  }

  get value() {
    return this.number.value
  }

  addInput(type, value, min, max, step) {
    var input = document.createElement("input")
    input.type = type
    input.value = value
    input.min = min
    input.max = max
    input.step = step
    this.div.appendChild(input)
    return input
  }
}

class Button {
  constructor(parent, label, onClickFunc) {
    this.input = document.createElement("input")
    this.input.type = "button"
    this.input.value = label
    parent.appendChild(this.input)
    this.input.addEventListener("click", this, false)
    this.onClickFunc = onClickFunc
  }

  handleEvent(event) {
    switch (event.type) {
      case "click":
        this.onClick(event)
        break
    }
  }

  onClick(event) {
    this.onClickFunc(event)
  }
}

class MultiNumberInput {
  constructor(parent, text, value, min, max, step, onInputFunc) {
    this.defaultValue = value
    this.min = min
    this.max = max
    this.step = step
    this.onInputFunc = onInputFunc
    this.inputs = []

    this.div = document.createElement("div")
    this.heading = new Heading(this.div, 2, text)
    this.div.className = "multiNumberInput"
    this.buttonPush = new Button(this.div, "Push", () => this.push())
    this.buttonPop = new Button(this.div, "Pop", () => this.pop())
    parent.appendChild(this.div)

    this.div.addEventListener("input", this, false)
  }

  handleEvent(event) {
    switch (event.type) {
      case "input":
        this.onInput(event)
        break
    }
  }

  onInput(event) {
    // console.log(event)
    this.onInputFunc(event)
  }

  get value() {
    var value = []
    for (var i = 0; i < this.inputs.length; ++i) {
      value.push(this.inputs[i].value)
    }
    return value
  }

  push() {
    var numberInput = new NumberInput(
      this.div,
      this.getLabel(this.inputs.length),
      this.defaultValue,
      this.min,
      this.max,
      this.step
    )
    this.inputs.push(numberInput)
  }

  pop() {
    var child = this.inputs.pop().div
    this.div.removeChild(child)
  }

  getLabel(index) {
    return index + ":"
  }
}

class Div {
  constructor(parent, id) {
    this.div = document.createElement("div")
    this.div.id = id
    parent.appendChild(this.div)
  }
}

class Heading {
  constructor(parent, level, text) {
    this.h = document.createElement("h" + level)
    this.h.textContent = text
    parent.appendChild(this.h)
  }
}

class Description {
  constructor(parent) {
    this.details = document.createElement("details")
    this.details.id = "description"
    parent.appendChild(this.details)

    this.summary = document.createElement("summary")
    this.summary.textContent = "使い方"
    this.details.appendChild(this.summary)

    this.dl = document.createElement("dl")
    this.details.appendChild(this.dl)
  }

  add(term, description) {
    var dt = document.createElement("dt")
    dt.textContent = term
    this.details.appendChild(dt)

    var dd = document.createElement("dd")
    dd.textContent = description
    this.details.appendChild(dd)
  }
}

class SoundControl {
  constructor(parent) {
    this.context = new AudioContext()
    this.filter = null

    this.pw = 0.4
    this.pw = this.pw * 0.48 + 0.5 // チューニング

    this.div = new Div(parent, "soundControl")
    this.buttonPlay = new Button(this.div.div, "Play", () => this.play())
  }

  square(phase) {
    phase /= 2 * Math.PI
    return (phase % 1 < this.pw) ? -1 : 1
  }

  makeWave(length, sampleRate) {
    // ノイズを生成。
    var wave = new Array(sampleRate * length)
    var twopif = 2 * Math.PI * 1000 / sampleRate
    for (var i = 0; i < wave.length; ++i) {
      wave[i] = this.filter.pass(Math.random() * 2 - 1)
      // wave[i] = this.filter.pass(this.square(twopif * i))
    }
    return wave
  }

  makeBuffer() {
    var rate = this.context.sampleRate
    var wave = new Float32Array(this.makeWave(0.2, rate))
    console.log(wave)
    var buffer = this.context.createBuffer(1, wave.length, rate)
    buffer.copyToChannel(wave, 0, 0)
    return buffer
  }

  play() {
    var source = this.context.createBufferSource()
    source.buffer = this.makeBuffer()
    source.connect(this.context.destination)
    source.start()
  }
}

class IIRFilter {
  constructor(a, b) {
    this.a = a
    this.b = b
    this.x = new Array(b.length).fill(0)
    this.y = new Array(a.length).fill(0)
  }

  reset() {
    this.x.fill(0)
    this.y.fill(0)
  }

  pass(value) {
    this.x.unshift(value)
    this.x.pop()
    var output = 0
    for (var i = 0; i < this.x.length; ++i) {
      output += this.x[i] * this.b[i]
    }
    for (var i = 1; i < this.y.length; ++i) {
      output -= this.y[i] * this.a[i]
    }
    output *= this.a[0]
    this.y[0] = output
    this.y.unshift(0)
    this.y.pop()
    return output
  }
}


// http://web.eecs.utk.edu/~roberts/ECE315/Miscellaneous/TransFuncAndFreqResp.pdf
// 利用例：
// a = [2, 5, 2] // 分母。
// b = [0, 0, 3] // 分子。
// { frequency, phase } = transferFunction(a, b)
function transferFunction(a, b) {
  var degree = Math.max(a.length, b.length)

  var resolution = 512
  var frequency = new Array(resolution)
  var phase = new Array(resolution)
  for (var n = 0; n < resolution; ++n) {
    var omega = Math.PI * n / resolution
    // var omega = Math.pow(Math.PI, (n + 1) / resolution)
    var jo = new Z(0, omega)
    jo.exp()
    var jomega = [new Z(1, 0)]
    for (var i = 1; i < degree; ++i) {
      var temp = jo.clone().powr(i)
      jomega.push(temp)
    }

    var denom = new Z(0, 0)
    for (var i = 0; i < a.length; ++i) {
      denom.add(Z.mulr(jomega[i], a[i]))
    }

    var numer = new Z(0, 0)
    for (var i = 0; i < b.length; ++i) {
      numer.add(Z.mulr(jomega[i], b[i]))
    }

    var h = Z.div(numer, denom)
    frequency[n] = todBFS(h.abs())
    // frequency[n] = h.abs()
    phase[n] = h.arg()
  }
  return { frequency, phase }
}

function todBFS(value) {
  return 20 * Math.log10(value)
}

function refresh() {
  var {frequency, phase} = transferFunction(inputA.value, inputB.value)
  // console.log(frequency)
  // console.log(phase)

  freq.left = frequency
  freq.normalize()

  ph.left = phase
  ph.normalize(Math.PI)

  // console.log(freq.peakValue, todBFS(freq.peakValue))

  frequencyView.set(freq.left)
  phaseView.set(ph.left)

  soundControl.filter = new IIRFilter(inputA.value, inputB.value)
}

var divMain = new Div(document.body, "main")
var title = new Heading(divMain.div, 1, "ボード線図")
var description = new Description(divMain.div)
description.add("IIRフィルタのボード線図です。", "")
description.add("Aは分母、Bは分子の項を表しています。", "")
description.add("Pushボタンで項を追加して適当に値を変えるとグラフが描画されます。", "")
description.add("Popボタンで項を削除できます。", "")
description.add("Playボタンでホワイトノイズにフィルタをかけた音を聞くことができます。", "")
var soundControl = new SoundControl(divMain.div)

var freq = new Wave(1)
var ph = new Wave(1)
var frequencyView = new WaveView(divMain.div, 512, 256, [])
var phaseView = new WaveView(divMain.div, 512, 256, [])

var limit = 1
var inputA = new MultiNumberInput(divMain.div, "a", 0, -limit, limit, 0.001, () => refresh())
var inputB = new MultiNumberInput(divMain.div, "b", 0, -limit, limit, 0.001, () => refresh())


refresh()

