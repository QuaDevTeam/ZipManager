<template>
  <div class="wrapper">
    <div class="title">ZipManager Demo</div>
    <div class="selector">
      <input class="url-input" placeholder="Please input an url of a zip package file" type="text" v-model="zipUrl" />
      <button class="submit" type="button" @click="loadZip">Load</button>
    </div>
    <div class="getter">
      <input
        class="url-input"
        placeholder="Please input an asset name or an asset key"
        type="text"
        v-model="getterInput"
      />
      <button class="submit" type="button" @click="getByName">Get By Name</button>
      <button class="submit" type="button" @click="getByKey">Get By Key</button>
    </div>
    <div class="list">
      <table>
        <tr>
          <th>key</th>
          <th>name</th>
          <th>pname</th>
        </tr>
        <tr v-for="item in list" :key="item.key">
          <td>{{ item.key }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.packageName }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script lang="js">
import { defineComponent, onMounted, ref } from 'vue'
import ZipManager from '../../dist/zip-manager.esm.js';

const manager = new ZipManager('zm-demo');

export default defineComponent({
  setup() {
    const zipUrl = ref('');
    const getterInput = ref('');
    const list = ref([]);

    const loadZip = () => {
      manager.load(zipUrl.value);
    };

    onMounted(async () => {
      list.value = await manager.list();
    });

    const getByName = async () => {
      console.log(await manager.getByName(getterInput.value));
    };

    const getByKey = async () => {
      console.log(await manager.getByKey(getterInput.value));
    };

    return {
      zipUrl,
      loadZip,
      list,
      getterInput,
      getByName,
      getByKey,
    };
  },
});
</script>

<style>
html,
body,
#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.wrapper {
  padding: 1.25rem 1.75rem;
  box-sizing: border-box;
}
.title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
.url-input {
  width: 400px;
}
.submit {
  margin-left: 12px;
}
.getter {
  margin-top: 1rem;
}
table {
  text-align: left;
  margin-top: 1.5rem;
}
td {
  padding-right: 1rem;
}
</style>
