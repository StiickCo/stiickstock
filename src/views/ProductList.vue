<template>
<div>
  <v-card>
    <v-card-title>
      <v-col>
        <v-row>
            <v-switch inset v-model="filterStock" label="Ocultar produtos sem estoque"></v-switch>
        </v-row>

        <v-row>
            <v-switch inset v-model="filterID" label="Ocultar ID dos produtos"></v-switch>
        </v-row>

      </v-col>
      <v-spacer></v-spacer>
      <v-text-field v-model="search" label="Procurar" single-line hide-details></v-text-field>
    </v-card-title>
    <v-data-table 
        :headers="computedHeaders" 
        :items="computedProducts" 
        :search="search"  
        :single-expand=true 
        show-expand
        loading-text="Carregando... Por favor aguarde!"
        no-data-text="Nenhum item encontrado!"
        no-results-text="Item não encontrado!"
        :loading="loading"
        >  

    <template v-slot:top>
        <div class="text-right mr-4">
            <v-dialog v-model="dialogAdd" width="500">
            <template v-slot:activator="{ on }">
                <v-btn style="margin: 0 0 1rem 0" color="green darken-2" dark v-on="on" @click="clear()">Adicionar novo produto</v-btn>
            </template>
            <!-- ADD PRODUCT FORM VALIDATION -->
            <v-form v-model="valid">
                <v-card class="">
                    <v-card-title class="headline green lighten-2" primary-title>Adicionar novo produto</v-card-title>

                    <v-card-text>
                        
                    <v-text-field 
                        label="Criador do produto" 
                        v-model='product.userOwner' 
                        readonly>        
                    </v-text-field>

                    <v-text-field 
                        :rules="productRules" 
                        label="Nome do produto *" 
                        v-model='product.name'>
                    </v-text-field>

                    <v-text-field 
                        :rules="productRules" 
                        type='number' 
                        step='0.01' 
                        label="Preço unitário *" 
                        prefix="R$" 
                        v-model='product.price'>
                    </v-text-field>

                    <v-text-field 
                        :rules="productRules" 
                        type='number' 
                        label="Quantidade de produtos em estoque *" 
                        v-model='product.quantity'>
                    </v-text-field>

                    <v-text-field 
                        label="Descrição do produto (opcional)" 
                        v-model='product.details'>
                    </v-text-field>

                    <v-overflow-btn 
                        :items="teamList" 
                        v-model="product.teamOwner" 
                        label="Pertencente ao time (opcional)">    
                    </v-overflow-btn>

                    </v-card-text>
                    <v-divider></v-divider>

                    <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn 
                        color="blue darken-2" 
                        @click="addProduct(product)" 
                        :disabled="!valid" 
                        text
                        >Adicionar produto
                    </v-btn>
                    <v-btn color="red" text @click="dialogAdd = false">Cancelar</v-btn>
                    </v-card-actions>
                </v-card>
            </v-form>
            </v-dialog>
            <v-overflow-btn  dense :items="teamList" @input='getProducts' :menu-props="{closeOnClick: true}" v-model="selectedTeam"></v-overflow-btn>
    </div>
    
    </template>
        
        <!-- ADD ONE -->
        <template v-slot:item.plus ="{ item }">
            <v-btn  v-if="wWidth < 600" @click="addOne(item)" class="mr-n4" icon> <v-icon color="green">add</v-icon></v-btn>
            <v-btn  v-else @click="addOne(item)" class="mr-n12" icon> <v-icon color="green">add</v-icon></v-btn>
        </template>
        
        <!-- QUANTITY -->
        <template v-slot:item.quantity ="{ item }">
            <span> {{ item.quantity }} </span>
        </template>
        
        <!-- REMOVE ONE -->
        <template v-slot:item.minus ="{ item }">
            <v-btn v-if="wWidth >= 600" @click="removeOne(item)" class="ml-n12" icon> <v-icon color="red">remove</v-icon> </v-btn> 
            <v-btn v-else @click="removeOne(item)" class="mr-n4" icon> <v-icon color="red">remove</v-icon> </v-btn> 
        </template>
        
        <!-- TOTAL VALUE -->
        <template v-slot:item.total="{ item }">
            <span>{{ item.total = (item.price * item.quantity) }}</span>
        </template>
        
        <!-- LABELS/TAGS -->
        <template v-slot:item.labels="{ item }">
            <Labels 
                :labelList="labels" 
                :item="item" 
                :updateFunction="updateLabel"
            />
            <br>
            <v-chip label class="chips" small close @click:close="removeLabel(item,label)" :color="label.color" v-for="(label, i) in item.labels" :key="i"><span>{{label.name}}</span></v-chip>
        </template>

        <!-- DESCRIPTION -->
        <template v-slot:expanded-item="{ item }">
            <td :colspan="headers.length" class="pa-4"> {{ item.details}} </td>
        </template>

        <!-- ACTIONS -->
        <template v-slot:item.actions="{ item }">
            <v-btn icon :to="`/productInfo/${item.id}`"> <v-icon color="blue darken-1">info</v-icon> </v-btn>
            <v-btn icon @click="getProduct(item);dialogEdit = true;"> <v-icon>edit</v-icon> </v-btn>
            <v-btn icon @click="getDelete(item)"> <v-icon color="red lighten-1 "> delete</v-icon> </v-btn>
        </template>
    </v-data-table>

    <!-- ********** DIALOGS ********** -->
        <!-- Delete -->
        <v-dialog v-model="dialogDelete" width="500">
            <v-card>
            <v-card-title class="headline green lighten-2" primary-title>Deletar produto</v-card-title>
    
            <v-card-text class="subtitle-1">Deseja mesmo deletar o produto "{{ prodDeleteName }}"?</v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-btn color="red" text @click="removeProduct(prodDeleted)">Deletar</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue-darken-2" text @click="dialogDelete = false">Cancelar</v-btn>
            </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Edit -->
        <v-dialog v-model="dialogEdit" width="500">
            <v-card>
                <v-card-title class="headline green lighten-2" primary-title>Editar produto</v-card-title>
                <v-card-text>
                <v-text-field label="Criador do produto" readonly v-model='product.userOwner'></v-text-field>
                <v-text-field required label="Nome do produto" v-model='product.name'></v-text-field>
                <v-text-field type='number' step='0.01' label="Preço unitário" prefix="R$" v-model='product.price'></v-text-field>
                <v-text-field type='number' label="Quantidade de produtos em estoque" v-model='product.quantity'></v-text-field>
                <v-text-field label="Descrição do produto (opcional)" v-model='product.details'></v-text-field>
                <v-overflow-btn dense :items="teamList" v-model="product.teamOwner"></v-overflow-btn>
                </v-card-text>
                <v-divider></v-divider>

                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" text @click="addProduct(product)">Salvar</v-btn>
                <v-btn color="red" text @click="dialogEdit = false">Cancelar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
  </v-card>
  <v-snackbar :timeout='snackbar.timeout' :color="snackbar.color" v-model="snackbar.show">
        {{ snackbar.text }}
    </v-snackbar>
</div>
</template>
<script>
import { APIService } from "../resources/api";
const api = new APIService();
export default {
    name: "ProductList",
    mounted () {
      this.getUserData();
      this.getProducts();
      this.getTeams();
      this.getWindow();
      this.addDebug()
    },
    data () {
      return {
        dialogEdit: false,
        dialogDelete: false,
        dialogAdd: false,
        prodDeleteName: '',
        wHeight: 0,
        wWidth: 0,
        product: {
          id: "",
          name: "",
          price: "",
          quantity: "",
          details: "",
          userOwner: "",
          teamOwner: "",
          labels:[],
        },
        loading:false,
        prodDeleted: 0,
        search: '',
        filterStock: false,
        filterID: true,
        headers: [{ text: 'ID', value: 'id'},
            { text: 'Nome do produto', value: 'name'},
          { text: 'Preço por item', value: 'price' },
          { text: 'Tags', value:'labels', sortable:false},
          { text: '', value: 'plus', align:'end', width:'150',sortable: false},
          { text: 'Estoque atual', value: 'quantity', align: 'center', width:'130 '},
          { text: '', value: 'minus', align:'start', width:'150',sortable: false},
          { text: 'Valor total', value: 'total' },
          { text: 'Ações', align: 'center', sortable: false, value: 'actions'},
        ],
        products: [],
        user:[],
        teamList:["Meus produtos"],
        selectedTeam:"Meus produtos",
        productRules:[
            v => !!v || 'Este campo é obrigatório',
        ],
      valid:false,
      labels:[
      {'name':'Lorem', 'color':'blue'},
      {'name':'ipsum', 'color':'blue-grey'},
      {'name':'dolor', 'color':'green'},
      {'name':'sit amet', 'color':'red'},
      {'name':'consectetur adipisicing', 'color':'gray'}
      ],
      snackbar:{
        show:false,
        timeout:3000,
        text:'',
        color:''
        },
      }
    },
    methods:{
        addDebug() {
            if (this.user.name == "admin@admin.com") {
                this.teamList.push("Todos (DEBUG)")
            }
        },
        getDelete(item){
            this.prodDeleteName = item.name;
            this.prodDeleted = item;
            this.dialogDelete = true;
        },
        async removeProduct(item) {
          let res = await api.deleteProduct(item).then(data => {
            if (data.status == 200) {
                this.snackbar.show = true;
                this.snackbar.text = "Produto removido com sucesso!"
                this.snackbar.color = "green";
                this.getProducts();
            }else{
                this.snackbar.show = true;
                this.snackbar.text = "Ocorreu um erro ao remover o produto, por favor tente novamente mais tarde"
                this.snackbar.color = "red";
            }
          })
          this.dialogDelete = false;
        },
        getProduct(item){
            this.product.name = item.name;
            this.product.price = item.price;
            this.product.quantity = item.quantity;
            this.product.details = item.details;
            this.product.id = item.id
            this.product.userOwner = item.userOwner;
            this.product.teamOwner = item.teamOwner;
            this.product.labels = item.labels;
        },
        async addProduct(item){
            if (item.teamOwner == "Todos (DEBUG)" || item.teamOwner == "Meus produtos"){
                item.teamOwner = "";
            }
            let res = await api.saveProduct(item).then(data => {
              if (data.status == '200') {
                this.snackbar.show = true;
                this.snackbar.text = "Produto criado com sucesso!"
                this.snackbar.color = "green";

                this.getProducts();
                this.dialogAdd = false;
                this.dialogEdit = false;
              }else{
                this.snackbar.show = true;
                this.snackbar.text = "Ocorreu um erro ao criar o produto, por favor tente novamente mais tarde"
                this.snackbar.color = "red";
              }
            })
        },
        getProducts() {
            this.loading = true;
          let res = api.findAllProduct().then(data => {
            this.products=[];
            for (let i = 0; i < data.length; i++) {
                if (this.selectedTeam == "Meus produtos"){
                    if (data[i].userOwner == this.user.name){
                        this.products.push(data[i]);    
                    }

                }else if(data[i].teamOwner == this.selectedTeam){
                    this.products.push(data[i]);

                }else if (this.selectedTeam == "Todos (DEBUG)"){ // Esse aqui vai ser removido depois, está aqui apenas para testes
                    this.products = data;
                    break;
                }
                
                
            }
            this.loading = false;
          });
        },
        getTeams() {
                let res = api.findAllTeam().then(data => {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].users.includes(this.user.name)){
                        this.teamList.push(data[i].name);
                    }
                }
            });
        },
        clear(){
            this.product.name = '',
            this.product.price = '',
            this.product.quantity =  '',
            this.product.details = ''
        },
        addOne(item){
            this.getProduct(item);
            this.product.quantity++;
            this.addProduct(this.product);
        },
        removeOne(item){
            this.getProduct(item);
            this.product.quantity--;
            this.addProduct(this.product);
        },
        getWindow(){
            this.wWidth = window.innerWidth;
            this.wHeight = window.innerHeight;
        },
        getUserData(){
            this.user = JSON.parse(localStorage.getItem('user'));
            this.product.userOwner = this.user.name
        },
        updateLabel(item,labels){
            item.labels = labels;
            item.labels.sort(function( a, b ) {
                return a.name.localeCompare(b.name);
            });
            this.addProduct(item);
        },
        removeLabel(item, label){
            let labelIndex = item.labels.indexOf(label);
            item.labels.splice(labelIndex, 1);
            this.addProduct(item);

        }
    

    },
    computed: {
        computedProducts(){
            if (this.filterStock){
                return this.products.filter(products => products.quantity != 0);
            }
            return this.products;
        },
        computedHeaders(){
            if (this.filterID){
                return this.headers.filter(headers => headers.text != "ID");
            }
            return this.headers;
        },
    }
}
</script>

<style scoped>
.chips{
    margin: 2px;
    font-size: 1em;
}
</style>