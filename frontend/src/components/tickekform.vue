<template>
    <cardtitle>สร้าง Ticket ใหม่</cardtitle>
    <card>
        <cardcontent>
            <form @submit.prevent="submitTicket" class="space-y-4">
                <input v-model="title" type="text" placeholder="หัวข้อปัญหา" class="input" required />
                <textarea v-model="description" placeholder="รายละเอียด" class="input" rows="5" />

                <input v-model="contact" type="text" placeholder="ข้อมูลติดต่อ" class="input" />
                <input v-model="department" type="text" placeholder="แผนก" class="input" />

                <select v-model="type_id" class="input">
                    <option disabled value="">-- เลือกประเภท --</option>
                    <option v-for="type in types" :key="type.id" :value="type.id">
                        {{ `${type.name}: ` }} {{ type.description }}
                    </option>
                </select>

                <select v-model="priority" class="input">
                    <option disabled value="">-- เลือกระดับความสำคัญ --</option>
                    <option value="low">ต่ำ</option>
                    <option value="medium">กลาง</option>
                    <option value="high">สูง</option>
                </select>

                <!-- <select v-model="status" class="input">
                <option disabled value="">-- สถานะ --</option>
                <option value="open">เปิด</option>
                <option value="in_progress">กำลังดำเนินการ</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="closed">ปิดแล้ว</option>
            </select> -->

                <input type="file" multiple @change="handleFileChange" class="input" accept=".pdf, .jpg, .jpeg, .png" />
                <!-- แสดงรายการไฟล์ที่เลือก -->
                <ul class="mt-2 space-y-1">
                    <li v-for="(file, index) in files" :key="index"
                        class="flex justify-between items-center bg-gray-100 px-3 py-1 rounded">
                        <span class="truncate max-w-xs">{{ file.name }}</span>
                        <button type="button" @click="removeFile(index)" class="text-red-500 hover:underline text-sm">
                            ลบ
                        </button>
                    </li>
                </ul>

                <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    ส่ง Ticket
                </button>
            </form>
        </cardcontent>
    </card>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import { config } from '@/config';
import Swal from 'sweetalert2'
import api from '@/api/axios-instance'



import cardtitle from '@/ui/cardtitle.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';

const title = ref('')
const description = ref('')
const type_id = ref('')
const priority = ref('')
// const status = ref('')
const contact = ref('')
const department = ref('')
const files = ref<File[]>([])
const types = ref([])

function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) return

    const selectedFiles = Array.from(input.files)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']

    if (selectedFiles.length > 5) {
        alert('ไม่สามารถแนบไฟล์เกิน 5 ไฟล์ได้')
        input.value = '' // รีเซ็ต input
        return
    }

    const validFiles: File[] = []
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        if (allowedTypes.includes(file.type)) {
            validFiles.push(file)
        } else {
            alert(`ไม่อนุญาตให้แนบไฟล์ประเภท: ${file.type}`)
        }
    }

    files.value = validFiles
}

onMounted(async () => {
    const res = await api.get(`/types`)
    types.value = res.data.data
    // console.log('type: ', types.value)
})

const submitTicket = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return alert('กรุณาเข้าสู่ระบบ')
    
    const decoded: any = jwtDecode(token)
    const userId = decoded.userId || decoded.id

    if (!title.value || !description.value || !type_id.value || !priority.value || !contact.value || !department.value) {
        alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
        return;
    }

    const result = await Swal.fire({
        title: 'ส่ง Ticket?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ส่ง',
        cancelButtonText: 'ยกเลิก',
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    })
        if (result.isConfirmed) {
            const formData = new FormData()
            formData.append('title', title.value)
            formData.append('description', description.value)
            formData.append('type_id', type_id.value)
            formData.append('priority', priority.value)
            // formData.append('status', status.value)
            formData.append('contact', contact.value)
            formData.append('department', department.value)
            formData.append('user_id', userId)

            files.value.forEach(file => {
                formData.append('files', file)
            })

            try {
                await api.post(`/tickets/create`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                })
                Swal.fire({
                    title: 'ส่งแล้ว!',
                    text: 'ส่งข้อมูลสำเร็จ',
                    icon: 'success',
                    showClass: {
                        popup: 'animate__animated animate__heartBeat'
                    },
                    timer: 2000
                });
            } catch (err) {
                await Swal.fire(
                    'ผิดพลาด!',
                    'ไม่สามารถlส่งข้อมูลได้: ' + err.message,
                    'error'
                )
            }
        }
}
    //     const formData = new FormData()
    //     formData.append('title', title.value)
    //     formData.append('description', description.value)
    //     formData.append('type_id', type_id.value)
    //     formData.append('priority', priority.value)
    //     // formData.append('status', status.value)
    //     formData.append('contact', contact.value)
    //     formData.append('department', department.value)
    //     formData.append('user_id', userId)

    //     files.value.forEach(file => {
    //         formData.append('files', file)
    //     })

    //     try {
    //         await axios.post(`${config.apiUrl}/api/tickets/create`, formData, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'multipart/form-data'
    //             }
    //         })
    //         alert('ส่ง Ticket สำเร็จ')
    //     } catch (err) {
    //         console.error(err)
    //         alert('เกิดข้อผิดพลาด')
    //     }
    // }
    const removeFile = (index: number) => {
        files.value.splice(index, 1)
    }

</script>

<style scoped>
.input {
    width: 100%;
    border: 1px solid #ccc;
    padding: 8px;
    border-radius: 6px;
}
</style>