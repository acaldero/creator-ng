<!--
Copyright 2018-2025 Felix Garcia Carballeira, Diego Camarmas Alonso,
                    Alejandro Calderon Mateos, Luis Daniel Casais Mezquida

This file is part of CREATOR.

CREATOR is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

CREATOR is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with CREATOR.  If not, see <http://www.gnu.org/licenses/>.
-->

<script>
import { destroyClickedElement } from "../../utils.mjs"
export default {
  props: {
    id: { type: String, required: true },
  },

  data() {
    return {
      //Saved file name
      name_arch_save: "",
    }
  },

  methods: {
    //Download the architecture
    arch_save() {
      //Generate architecture JSON
      const aux_object = jQuery.extend(true, {}, architecture)
      const aux_architecture = register_value_serialize(aux_object)

      aux_architecture.components.forEach((c, _i) => {
        c.elements.forEach((e, _j) => {
          if (e.default_value) e.value = e.default_value
          else e.value = 0
        })
      })

      const text_2_write = JSON.stringify(aux_architecture, null, 2)
      const textFileAsBlob = new Blob([text_2_write], { type: "text/json" })
      let file_name

      if (this.name_arch_save === "") {
        file_name = "architecture.json"
      } else {
        file_name = this.name_arch_save + ".json"
      }

      // Download the JSON file
      // yes, this is actually the way to do it in JS...
      const download_link = document.createElement("a")
      download_link.download = file_name
      download_link.innerHTML = "My Hidden Link"

      window.URL = window.URL || window.webkitURL

      download_link.href = window.URL.createObjectURL(textFileAsBlob)
      download_link.onclick = destroyClickedElement
      download_link.style.display = "none"
      document.body.appendChild(download_link)

      download_link.click()

      // Add the new architecture on CREATOR
      // const name_arch = file_name.replace("\.json", "")
      // load_architectures_available.push({
      //   name: name_arch,
      //   img: "./images/personalized_logo.png",
      //   alt: name_arch + " logo",
      //   id: "select_conf" + name_arch,
      //   description: architecture.arch_conf[2].value,
      //   available: 1,
      // })
      // load_architectures.push({ id: name_arch, architecture: text_2_write })

      // Refresh cache values
      // if (typeof Storage !== "undefined") {
      //   let auxArch = JSON.stringify(load_architectures, null, 2)
      //   localStorage.setItem("load_architectures", auxArch)

      //   auxArch = JSON.stringify(load_architectures_available, null, 2)
      //   localStorage.setItem("load_architectures_available", auxArch)
      // }

      show_notification("Save architecture", "success")
    },

    //Clean save architecture form
    clean_form() {
      this.name_arch_save = ""
    },
  },
}
</script>

<template>
  <b-modal
    :id="id"
    title="Save Architecture"
    ok-title="Save to File"
    @ok="arch_save"
    @hidden="clean_form"
  >
    <span class="h6">Enter the name of the architecture to save:</span>
    <br />
    <b-form-input
      v-model="name_arch_save"
      type="text"
      placeholder="Enter the name"
      class="form-control form-control-sm fileForm"
      title="Save Architecture"
    >
    </b-form-input>
  </b-modal>
</template>

<style lang="scss" scoped>
.fileForm {
  background-color: white;
  color: black;
}
</style>
