<template>
    <AppLayout>
        <cardtitle>
            รายละเอียด Ticket: {{ form.reference_number }}
        </cardtitle>
        <card>
            <cardcontent>
                <form @submit.prevent="handleSubmit" class="w-full bg-white rounded-xl overflow-hidden p-6">
                    <!-- ส่วนฟอร์มหลัก -->
                    <div class="space-y-6">
                        <!-- หัวข้อ -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
                            <input v-model="form.title" :readonly="!isEditing"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                :class="{ 'bg-gray-50': !isEditing }" />
                        </div>

                        <!-- รายละเอียด -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                            <textarea v-model="form.description" :readonly="!isEditing"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                :class="{ 'bg-gray-50': !isEditing }" rows="5"></textarea>
                        </div>

                        <!-- ติดต่อ -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">ติดต่อ</label>
                            <input v-model="form.contact" :readonly="!isEditing"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                :class="{ 'bg-gray-50': !isEditing }" />
                        </div>

                        <!-- ข้อมูลแบบ Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            <!-- หมวดหมู่ -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                                <select v-model="form.type_id" :disabled="!isEditing"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditing }">
                                    <option v-for="type in types" :key="type.id" :value="type.id">
                                        {{ type.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- แผนก -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
                                <select v-model="form.department_id" :disabled="!isEditing"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditing }">
                                    <option v-for="department in departments" :key="department.id"
                                        :value="department.id">
                                        {{ department.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- ความสำคัญ -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">ความสำคัญ</label>
                                <select v-model="form.priority" :disabled="!isEditing"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditing }">
                                    <option value="low">ต่ำ</option>
                                    <option value="medium">กลาง</option>
                                    <option value="high">สูง</option>
                                </select>
                            </div>

                            <!-- สถานะ -->
                            <div v-if="auth.user.role === 'USER' || auth.user.role === 'OFFICER' && form.user.id === auth.user.id">
                                <label class="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                <select v-model="form.status" :disabled="!isEditing"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditing }">
                                    <option value="open">รอดำเนินการ</option>
                                    <option value="in_progress">กำลังดำเนินการ</option>
                                    <option value="closed">เสร็จสิ้น</option>
                                </select>
                            </div>
                        </div>

                        <!-- ไฟล์แนบ -->
                        <div class="mb-8">
                            <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                ไฟล์แนบ
                            </h2>

                            <div v-if="form.files.length === 0"
                                class="text-gray-500 italic bg-gray-50 p-4 rounded-lg mb-4 border border-dashed border-gray-300">
                                ไม่มีไฟล์แนบ
                            </div>

                            <div v-else
                                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                                <div v-for="(file, index) in form.files" :key="file.id"
                                    class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 bg-white flex flex-col">
                                    <div class="p-3 hover:bg-gray-50 transition-colors duration-200 flex-grow">
                                        <!-- ส่วนแสดงไฟล์ -->
                                        <a :href="`${config.apiUrl}/uploads/user/${file.filename}`" target="_blank"
                                            rel="noopener noreferrer" class="flex items-start group">
                                            <div class="mr-2 text-blue-500 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                                    viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div class="min-w-0">
                                                <p
                                                    class="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200 break-all">
                                                    {{ file.filename }}
                                                </p>
                                            </div>
                                        </a>
                                    </div>

                                    <!-- ปุ่มลบ (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                    <div v-if="isEditing" class="border-t border-gray-100 p-2 bg-gray-50">
                                        <button @click.stop="removeExistingFile(index)" type="button"
                                            class="w-full py-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors duration-200 flex items-center justify-center text-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            ลบ
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <!-- ส่วนสำหรับเพิ่มไฟล์ใหม่ (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                            <div v-if="isEditing" class="mt-6 pt-6 border-t border-gray-200">
                                <h3 class="text-md font-semibold text-gray-700 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 mr-2 inline-block text-gray-500" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    เพิ่มไฟล์ใหม่ (สูงสุด {{ MAX_FILES }} ไฟล์รวมทั้งหมด)
                                </h3>
                                <input type="file" multiple @change="handleFileChange" class="input mb-3"
                                    accept=".pdf,.jpg,.jpeg,.png" />
                                <div v-if="newFiles.length > 0" class="mt-2">
                                    <h4 class="text-sm font-medium text-gray-600 mb-1">ไฟล์ใหม่ที่เลือก:</h4>
                                    <ul class="list-disc list-inside pl-4 space-y-1">
                                        <li v-for="(file, index) in newFiles" :key="index"
                                            class="text-sm text-gray-700 flex justify-between items-center py-1">
                                            <span>{{ file.name }} ({{ (file.size / 1024).toFixed(2) }} KB)</span>
                                            <button type="button" @click="removeNewFile(index)"
                                                class="ml-3 px-2 py-0.5 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded">ลบ</button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- ปุ่มดำเนินการ -->
                        <div v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'"
                            class="flex justify-end space-x-3 pt-4 border-t">
                            <button v-if="!isEditing" type="button" @click="isEditing = true"
                                class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                แก้ไข
                            </button>

                            <button v-if="isEditing" type="submit"
                                class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                บันทึก
                            </button>

                            <button v-if="isEditing" type="button" @click="cancelEdit"
                                class="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-colors duration-200">
                                ยกเลิก
                            </button>
                        </div>
                        <!-- ปุ่มดำเนินการ สำหรับ User-->
                        <div v-if="auth.user.role === 'USER'"
                            class="flex justify-end items-center space-x-3 pt-4 mt-8 border-t">
                            <!-- กลุ่มปุ่มแก้ไข/บันทึก/ยกเลิก -->
                            <div class="flex space-x-3">
                                <!-- ปุ่มแก้ไข (แสดงเมื่อไม่ใช่โหมดแก้ไข) -->
                                <button v-if="!isEditing" type="button" @click="isEditing = true"
                                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center hover:shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    แก้ไข
                                </button>

                                <!-- ปุ่มบันทึก (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                <button v-if="isEditing" type="submit"
                                    class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center hover:shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                    บันทึก
                                </button>

                                <!-- ปุ่มยกเลิก (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                <button v-if="isEditing" type="button" @click="cancelEdit"
                                    class="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </cardcontent>
        </card>
        <div>
            <cardtitle class="mt-6">ผู้รับผิดชอบ</cardtitle>
            <card>
                <cardcontent>
                    <form @submit.prevent="handleSubmitAssignee" class="overflow-hidden p-6">
                        <div class="space-y-6">
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-4">ชื่อผู้รับผิดชอบ</label>
                                <strong
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                    {{ form.assignee ? form.assignee.name : 'ยังไม่มีผู้รับผิดชอบ' }}
                                </strong>
                            </div>

                            <div v-if="auth.user?.role === 'OFFICER' && !form.assignee?.name && form.user.id !== auth.user.id" class="mb-6">
                                <button @click="assignToMe" type="button"
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    รับเรื่องเอง
                                </button>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER' && form.user.id !== auth.user.id">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                    <select v-model="form.status" :disabled="!isEditingAssignee"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        :class="{ 'bg-gray-50': !isEditingAssignee }">
                                        <option value="open">รอดำเนินการ</option>
                                        <option value="in_progress">กำลังดำเนินการ</option>
                                        <option value="closed">เสร็จสิ้น</option>
                                    </select>
                                </div>

                                <div v-if="auth.user.role === 'ADMIN'">
                                    <label
                                        class="block text-sm font-medium text-gray-700 mb-1">เปลี่ยนผู้รับผิดชอบ</label>
                                    <select v-model="selectedUserId" @change="assignUser" :disabled="!isEditingAssignee"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        :class="{ 'bg-gray-50': !isEditingAssignee }">
                                        <option value="" disabled>เลือกผู้รับผิดชอบ</option>
                                        <option v-for="user in officerList" :key="user.id" :value="user.id"
                                            class="py-2">
                                            {{ user.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                                <textarea v-model="form.comment" :readonly="!isEditingAssignee"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditingAssignee }" rows="5"></textarea>
                            </div>
                            <!-- ไฟล์แนบสำหรับผู้รับผิดชอบ -->
                            <div>
                                <AssigneeFileUpload :disabled="!isEditingAssignee"
                                    :ticket-id="form.id" ref="assigneeFileUploadRef"
                                    :initial-assignee-files="form.assigneeFiles"
                                    :class="{ 'bg-gray-50': !isEditingAssignee }"
                                    @files-uploaded="handleAssigneeFilesUploaded" />
                            </div>

                            <div class="flex flex-wrap justify-between items-center gap-y-3 pt-4 mt-8 border-t">
                                <!-- ปุ่มย้อนกลับ -->
                                <div class="flex space-x-2">
                                    <button @click="goBack" type="button"
                                        class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        <span>ย้อนกลับ</span>
                                    </button>
                                     <button @click="openLogsModal" type="button"
                                        class="flex items-center space-x-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-200 transition-colors duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>ดูประวัติ</span>
                                    </button>
                                </div>

                                <!-- กลุ่มปุ่มแก้ไข/บันทึก/ยกเลิก -->
                                <div class="flex space-x-3"
                                    v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'">
                                    <!-- ปุ่มแก้ไข (แสดงเมื่อไม่ใช่โหมดแก้ไข) -->
                                    <button v-if="!isEditingAssignee && form.user.id !== auth.user.id" type="button" @click="isEditingAssignee = true"
                                        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center hover:shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        แก้ไข
                                    </button>

                                    <!-- ปุ่มบันทึก (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                    <button v-if="isEditingAssignee" type="submit"
                                        class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center hover:shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7" />
                                        </svg>
                                        บันทึก
                                    </button>

                                    <!-- ปุ่มยกเลิก (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                    <button v-if="isEditingAssignee" type="button" @click="cancelEditAssignee"
                                        class="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </cardcontent>
            </card>
        </div>
    </AppLayout>
    <TicketLogsModal 
        :visible="showLogsModal"
        :logs="ticketLogs"
        :referenceNumber="form.reference_number"
        @close="closeLogsModal"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { config } from '@/config'
import api from '@/api/axios-instance'
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

import AppLayout from "@/layouts/AppLayout.vue";

import cardtitle from '@/ui/cardtitle.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';
import AssigneeFileUpload from '@/components/AssigneeFileUpload.vue';
import TicketLogsModal from '@/components/TicketLogsModal.vue';
import Swal from 'sweetalert2';

const route = useRoute()
const router = useRouter()
const isEditing = ref(false)
const isEditingAssignee = ref(false)

const showLogsModal = ref(false);

// Ref for AssigneeFileUpload component
const assigneeFileUploadRef = ref<InstanceType<typeof AssigneeFileUpload> | null>(null);

const MAX_FILES = 5
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

const ticketId = String(route.params.id)
interface TicketLogEntry {
    id: number;
    timestamp: string;
    user_name: string;
    action_type: string;
    details: string;
}
interface TicketType {
    id: number;
    name: string;
    // description?: string; // ถ้ามีข้อมูลนี้จาก API และต้องการใช้
}

interface Department {
    id: number;
    name: string;
}

interface User { id: number; name: string; email: string; role: 'USER' | 'OFFICER' | 'ADMIN' | 'BANNED' | ''; }

interface AssigneeApiFile {
    id: number;
    filename: string;
    filepath: string;
    ticket_id: number;
    uploadedBy_id: number;
    created_at: string;
}

interface TicketForm {
    id: number;
    reference_number: string; // เพิ่ม reference_number
    title: string;
    description: string;
    type_id: number | ''; // สามารถเป็น number (เมื่อเลือก) หรือ empty string (ค่าเริ่มต้น)
    priority: 'low' | 'medium' | 'high' | '';
    contact: string;
    user: User;
    department_id: number | '';
    assignee: any;
    comment: string;
    status: 'open' | 'in_progress' | 'pending' | 'closed' | ''; // สถานะที่เป็นไปได้ หรือ empty string
    files: Array<{
        id: number;
        filename: string;
        filepath: string;
    }>;
    assigneeFiles?: AssigneeApiFile[]; // ไฟล์จาก Assignee
}

const form = ref<TicketForm>({
    id: 0,
    reference_number: '', // เพิ่มค่าเริ่มต้น
    title: '',
    description: '',
    type_id: '',
    priority: '',
    contact: '',
    user: { id: 0, name: '', email:'', role: '' },
    department_id: '',
    assignee: {
        assignee_id: 0,
        name: ''
    },
    comment: '',
    status: '',
    files: [],
    assigneeFiles: [],
})

const types = ref<TicketType[]>([]);
const departments = ref<Department[]>([]);
const officerList = ref([]);
const selectedUserId = ref("");
// ไฟล์ใหม่ที่เลือกใน session การแก้ไขปัจจุบัน
const newFiles = ref<File[]>([])        // ไฟล์ใหม่ (ยังไม่ได้อัปโหลด)
const ticketLogs = ref<TicketLogEntry[]>([]);

const isAdmin = computed(() => auth.user.role === "ADMIN")
const canSelfAssign = computed(() =>
    auth.user.role === "OFFICER" && !form.value.assignee.assignee_id
)

const goBack = () => {
    router.go(-1) // ย้อนกลับ 1 หน้าในประวัติ
}


async function fetchTicket() {
    const res = await api.get(`/tickets/${route.params.id}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
    selectedUserId.value = res.data.assignee_id || ""
    const data = await res.data
    form.value = data as TicketForm;
    // console.log('Fetched ticket data: ', form.value)
}

async function fetchTypes() {
    const res = await api.get(`/types`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
    const data = await res.data
    types.value = data.data as TicketType[];
    // console.log('type: ', types.value)
}

async function fetchDepartments() {
    const res = await api.get(`/departments`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
    const data = await res.data
    departments.value = data as Department[];
    // console.log('department: ', departments.value)
}

function cancelEdit() {
    isEditing.value = false
    newFiles.value = [] // เคลียร์ไฟล์ใหม่ที่เลือกไว้เมื่อยกเลิกการแก้ไข
    fetchTicket() // รีโหลดข้อมูลเดิม
}

function cancelEditAssignee() {
    isEditingAssignee.value = false
    // Reset selected files in AssigneeFileUpload component
    if (assigneeFileUploadRef.value) {
        assigneeFileUploadRef.value.resetSelectedFiles();
    }
    fetchTicket() // รีโหลดข้อมูลเดิม
}

function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (!target.files) return;

    const selectedFilesFromInput = Array.from(target.files);
    const inputElement = target; // To reset its value if needed

    const validNewSelections: File[] = [];
    const invalidFileTypeNames: string[] = [];

    for (const file of selectedFilesFromInput) {
        if (ALLOWED_TYPES.includes(file.type)) {
            validNewSelections.push(file);
        } else {
            invalidFileTypeNames.push(file.name);
        }
    }

    if (invalidFileTypeNames.length > 0) {
        Swal.fire('ไฟล์ไม่ถูกต้อง', `ไม่อนุญาตให้แนบไฟล์ประเภทต่อไปนี้: ${invalidFileTypeNames.join(', ')}`, 'warning');
    }

    // If no valid files were selected from the input (e.g., all were wrong type, but some files were selected)
    if (validNewSelections.length === 0 && selectedFilesFromInput.length > 0) {
        inputElement.value = ''; // Clear the file input
        return;
    }

    const currentExistingFileCount = form.value.files.length; // Files already saved with the ticket
    const currentStagedNewFileCount = newFiles.value.length;  // New files already picked in this edit session
    const attemptingToAddCount = validNewSelections.length;   // New files just picked in this event

    if (currentExistingFileCount + currentStagedNewFileCount + attemptingToAddCount > MAX_FILES) {
        Swal.fire('เกินจำนวนไฟล์สูงสุด', `คุณสามารถแนบไฟล์ได้ทั้งหมดไม่เกิน ${MAX_FILES} ไฟล์ (ปัจจุบันมีไฟล์เดิม ${currentExistingFileCount} ไฟล์, ไฟล์ใหม่ที่เลือกไว้ ${currentStagedNewFileCount} ไฟล์, และคุณพยายามเพิ่มอีก ${attemptingToAddCount} ไฟล์).`, 'warning');
        inputElement.value = ''; // Clear the file input
        return;
    }

    newFiles.value.push(...validNewSelections);
    inputElement.value = ''; // Clear the file input so user can select same file again if they removed it
}

async function removeExistingFile(index: number) {
    const fileToRemove = form.value.files[index];
    if (!fileToRemove) {
        console.error('File not found at index:', index);
        return;
    }

    const result = await Swal.fire({
        title: 'ยืนยันการลบไฟล์?',
        text: `คุณต้องการลบไฟล์ "${fileToRemove.filename}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            // สมมติว่า API endpoint สำหรับลบไฟล์คือ /uploads/user/:filename
            // หรือถ้าใช้ ID: /files/${fileToRemove.id}
            await api.delete(`/tickets/requester-files/${ticketId}/${fileToRemove.filename}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });

            form.value.files.splice(index, 1); // ลบไฟล์ออกจากอาร์เรย์ใน UI

            Swal.fire('ลบแล้ว!', `ไฟล์ "${fileToRemove.filename}" ถูกลบเรียบร้อยแล้ว`, 'success');
        } catch (err) {
            console.error('Error deleting file:', err);
            Swal.fire('เกิดข้อผิดพลาด!', `ไม่สามารถลบไฟล์ได้: ${err.response?.data?.message || err.message}`, 'error');
        }
    }
}

function removeNewFile(index: number) {
    newFiles.value.splice(index, 1)
}

const handleAssigneeFilesUploaded = (updatedTicketDataFromApi?: TicketForm) => {
    // เมื่อ AssigneeFileUpload component emit 'files-uploaded'
    // updatedTicketDataFromApi คือข้อมูล ticket ทั้งหมดที่ได้จาก API หลังอัปโหลดไฟล์
    // console.log('Assignee files uploaded, new ticket data:', updatedTicketDataFromApi);
    if (form.value) { // Ensure form.value exists
        // อัปเดตข้อมูล ticket ในหน้านี้ โดยเฉพาะส่วน assigneeFiles
        if (updatedTicketDataFromApi && updatedTicketDataFromApi.assigneeFiles) {
            form.value.assigneeFiles = updatedTicketDataFromApi.assigneeFiles;
        } else if (updatedTicketDataFromApi === undefined || (updatedTicketDataFromApi && !updatedTicketDataFromApi.assigneeFiles)) {
            // This case might happen if the emit was just to signal a change, and we need to rely on fetchTicket
            // Or if the deletion happened and the emit payload was structured differently.
            // For simplicity and robustness after a deletion, re-fetching might be safer.
        }
    }
    // หรืออาจจะ re-fetch ข้อมูล ticket ใหม่ทั้งหมดก็ได้
    fetchTicket();
};


async function handleSubmit() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่', 'error');
        return;
    }

    if (!form.value.title || !form.value.description || !form.value.type_id || !form.value.priority || !form.value.contact || !form.value.department_id) {
        Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบทุกช่อง', 'warning');
        return;
    }

    const confirmResult = await Swal.fire({
        title: 'ยืนยันการแก้ไข Ticket?',
        text: "คุณต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, บันทึกเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (!confirmResult.isConfirmed) {
        return;
    }

    const formData = new FormData();
    formData.append('title', form.value.title);
    formData.append('description', form.value.description);
    formData.append('contact', form.value.contact);
    if (form.value.type_id) formData.append('type_id', form.value.type_id.toString());
    if (form.value.department_id) formData.append('department_id', form.value.department_id.toString());
    if (form.value.priority) formData.append('priority', form.value.priority);
    if (form.value.status) formData.append('status', form.value.status);

    // Append new files
    newFiles.value.forEach(file => {
        formData.append('new_ticket_files', file); // ตั้งชื่อ field ให้ backend รับไฟล์ใหม่
    });

    // ไฟล์เดิมที่ยังคงอยู่ (form.value.files) จะถูกจัดการโดย backend
    // การลบไฟล์เดิมทำผ่าน removeExistingFile() ซึ่งเรียก API ลบโดยตรงแล้ว
    // ไม่จำเป็นต้องส่ง form.value.files ไปอีกครั้ง

    try {
        await api.put(`/tickets/update/${route.params.id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // สำคัญมากสำหรับการอัปโหลดไฟล์
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
        })

        await Swal.fire({
            title: 'อัปเดต Ticket สำเร็จ',
            text: 'Ticket ของคุณถูกอัปเดตเรียบร้อยแล้ว',
            icon: 'success',
            showClass: {
                popup: 'animate__animated animate__heartBeat'
            },
            timer: 2000
        })
        isEditing.value = false
        newFiles.value = []; // เคลียร์รายการไฟล์ใหม่หลังอัปเดตสำเร็จ
        fetchTicket()
    } catch (err: any) {
        console.error("Error updating ticket:", err);
        await Swal.fire({
            title: 'ผิดพลาด',
            text: `ไม่สามารถอัปเดต Ticket ได้: ${err.response?.data?.message || err.message}`,
            icon: 'error'
        })
    }
}

async function handleSubmitAssignee() {
    const confirmResult = await Swal.fire({
        title: 'ยืนยันการบันทึกข้อมูลผู้รับผิดชอบ?',
        text: "การดำเนินการนี้จะบันทึกการเปลี่ยนแปลงสถานะ, ผู้รับผิดชอบ, หมายเหตุ และไฟล์ที่แนบใหม่ (ถ้ามี)",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, บันทึกเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (!confirmResult.isConfirmed) {
        return;
    }

    let filesProcessedSuccessfully = true;

    // Check if AssigneeFileUpload component has files selected and trigger its upload
    if (assigneeFileUploadRef.value && assigneeFileUploadRef.value.selectedFiles.length > 0) {
        Swal.fire({
            title: 'กำลังอัปโหลดไฟล์ผู้รับผิดชอบ...',
            text: 'กรุณารอสักครู่',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        filesProcessedSuccessfully = await assigneeFileUploadRef.value.uploadFiles();
        Swal.close(); // Close the "loading" Swal for files

        if (!filesProcessedSuccessfully) {
            // Error message is already shown by AssigneeFileUpload component.
            // You might want a more prominent error here or rely on the child's message.
            Swal.fire('อัปโหลดไฟล์ไม่สำเร็จ', 'พบปัญหาในการอัปโหลดไฟล์ของผู้รับผิดชอบ กรุณาตรวจสอบข้อความแจ้งเตือนและลองอีกครั้ง', 'error');
            return; // Stop if file upload failed
        }
    }

    try {
        await api.put(`/tickets/update/${route.params.id}`, {
            status: form.value.status,
            assignee_id: selectedUserId.value || null, // Send null if no assignee selected
            comment: form.value.comment,
        },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })

        await Swal.fire({
            title: 'อัพเดทส่วนผู้รับผิดชอบสำเร็จ',
            text: 'ส่วนผู้รับผิดชอบของคุณถูกอัพเดทเรียบร้อยแล้ว',
            icon: 'success',
            showClass: {
                popup: 'animate__animated animate__heartBeat'
            },
            timer: 2000
        });
        isEditingAssignee.value = false
        fetchTicket();
    } catch (err) {
        await Swal.fire({
            title: 'ผิดพลาด',
            text: `ไม่สามารถอัปเดตข้อมูลผู้รับผิดชอบได้: ${err.response?.data?.message || err.message}`,
            icon: 'error'
        });
    }
}

const loadOfficer = async () => {
    if (isAdmin.value) {
        const res = await api.get("/users/officer")
        officerList.value = res.data
    }
}

const assignUser = async () => {
    await api.put(`/tickets/assign/${ticketId}`, {
        userId: selectedUserId.value,
    })
    await fetchTicket()
}

const assignToMe = async () => {
    const confirmResult = await Swal.fire({
        title: 'ยืนยันการรับเรื่อง?',
        text: "คุณต้องการรับ Ticket นี้เป็นผู้รับผิดชอบใช่หรือไม่?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, รับเรื่องเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (confirmResult.isConfirmed) {
        try {
            await api.put(`/tickets/assign/${ticketId}`, {
                userId: auth.user.id,
            });
            await fetchTicket(); // Refresh ticket data to show new assignee
            Swal.fire(
                'รับเรื่องสำเร็จ!',
                'คุณได้รับมอบหมายให้เป็นผู้รับผิดชอบ Ticket นี้แล้ว',
                'success'
            );
        } catch (err: any) {
            console.error("Error assigning ticket to self:", err);
            Swal.fire('เกิดข้อผิดพลาด', `ไม่สามารถรับเรื่องได้: ${err.response?.data?.message || err.message}`, 'error');
        }
    }
};

async function fetchTicketLogs() {
    if (!ticketId) return;
    try {
        // Optionally, show a loading state for logs
        const response = await api.get(`/logs/tickets/${ticketId}`, { // Ensure this endpoint exists
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        ticketLogs.value = response.data; // Assuming API returns an array of log entries
    } catch (error) {
        console.error('Error fetching ticket logs:', error);
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดประวัติการดำเนินการของ Ticket ได้', 'error');
        ticketLogs.value = []; // Clear logs or handle error state
    }
}

async function openLogsModal() {
    await fetchTicketLogs();
    showLogsModal.value = true;
}

function closeLogsModal() {
    showLogsModal.value = false;
}
onMounted(() => {
    fetchTicket()
    fetchTypes()
    fetchDepartments()
    loadOfficer()
})
</script>

<style scoped>
.input {
    width: 100%;
    border: 1px solid #ccc;
    padding: 8px;
    border-radius: 6px;
}
</style>