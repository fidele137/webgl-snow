import { mat3 } from "gl-matrix/lib/gl-matrix.js";
import { SnowFlake } from "./snow-flake.js";
import {
  vertexShaderSource,
  fragmentShaderSource,
  createShader,
  createProgram
} from "../utils/webgl.js";

export class Snow {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl");

    this.projectionMatrix = this.getProjectionMatrix();

    this.snowFlakes = this.createSnowFlakes();

    this.addListeners();
    requestAnimationFrame(this.update.bind(this, this.gl));
  }

  addListeners() {
    this.onResize();
    window.addEventListener("resize", () => this.onResize());
  }

  onResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.projectionMatrix = this.getProjectionMatrix();
  }

  createSnowFlakes() {
    const count = window.innerWidth / 4;
    const snowFlakes = [];
    for (let i = 0; i < count; i++) {
      snowFlakes.push(new SnowFlake());
    }
    return snowFlakes;
  }

  getProjectionMatrix() {
    let matrix = [];
    mat3.identity(matrix);
    mat3.projection(
      matrix,
      this.gl.canvas.clientWidth,
      this.gl.canvas.clientHeight
    );
    return matrix;
  }

  get snowFlakesProps() {
    let snowFlakesProps = [];
    for (let snowFlake of this.snowFlakes) {
      snowFlakesProps = [...snowFlakesProps, ...snowFlake.props];
    }
    return snowFlakesProps;
  }

  update(gl) {
    this.snowFlakes.forEach(snowFlake => snowFlake.update());

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );
    const program = createProgram(gl, vertexShader, fragmentShader);

    const snowFlakePropsAttribLocation = gl.getAttribLocation(
      program,
      "a_snowFlakeProps"
    );

    const projectionMatrixUniformLocation = gl.getUniformLocation(
      program,
      "u_projectionMatrix"
    );

    const snowFlakePropsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, snowFlakePropsBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.snowFlakesProps),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(snowFlakePropsBuffer);
    const [size, type, normalize, stride, offset] = [4, gl.FLOAT, false, 0, 0];
    gl.vertexAttribPointer(
      snowFlakePropsAttribLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniformMatrix3fv(
      projectionMatrixUniformLocation,
      false,
      this.projectionMatrix
    );

    const [mode, offset2, count] = [gl.POINTS, 0, this.snowFlakes.length];
    gl.drawArrays(mode, offset2, count);

    requestAnimationFrame(this.update.bind(this, gl));
  }
}
