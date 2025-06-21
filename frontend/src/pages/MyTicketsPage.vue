<template>
  <AppLayout>
    <!-- <cardtitle2>
    </cardtitle2> -->
    <card>
      <cardcontent>
        <div class="flex flex-col sm:flex-wrap space-y-4 mb-4">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <cardtitle class="text-lg font-semibold mb-3 sm:mb-0">รายการแจ้งปัญหาของฉัน</cardtitle>
            <p class="text-sm text-gray-600 font-medium ml-3 sm:text-xs sm:mb-0">
              ปัญหาของฉันทั้งหมด:
              <span class="text-blue-600 font-semibold">{{ officerCreatedTickets.length }}</span>
              <!-- (แสดงผล: 
            <span class="text-blue-600 font-semibold">{{ filteredAndSearchedTickets.length }}</span>) -->
            </p>
          </div>
          <div
            class="flex flex-col space-y-3 sm:flex-wrap sm:justify-between sm:gap-y-3 sm:space-y-0 md:flex-wrap md:gap-y-3">
            <div class="flex flex-col space-y-3 justify-between sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <!-- ส่วนค้นหาและกรอง -->
              <div class="relative w-full sm:w-auto">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input type="text" v-model="searchQuery"
                  class="w-full sm:w-56 md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white transition-all duration-200"
                  placeholder="ค้นหาหัวข้อ, เลขอ้างอิง, สถานะ..." />
              </div>

              <div class="flex space-x-3">
                <!-- Items per page selector -->
                <div class="flex items-center space-x-2 sm:hidden">
                  <label for="perPageMobileInput" class="text-sm text-gray-600">แสดง:</label>
                  <input id="perPageMobileInput" type="number" min="1" v-model.number="perPage"
                    class="w-16 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  <span class="text-sm text-gray-600">รายการต่อหน้า</span>
                </div>
                <!-- Dropdown กรองสถานะ -->
                <div class="relative" ref="filterDropdownMyTicketsRef">
                  <button @click="toggleFilterDropdownMyTickets"
                    class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                    <!-- Filter Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414v6.586a1 1 0 01-1.414.914l-2-1A1 1 0 0110 19.414V13.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                  <!-- Dropdown List -->
                  <div v-if="isFilterDropdownOpenMyTickets"
                    class="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 left-0 sm:right-0 sm:left-auto max-h-80 overflow-y-auto">
                    <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-1">กรองตามความสำคัญ</div>
                    <ul class="py-1 border-b border-gray-200">
                      <li @click="applyMyTicketsFilter('priority', null)"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        ทั้งหมด (ความสำคัญ)
                      </li>
                      <li @click="applyMyTicketsFilter('priority', 'high')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">สูง</li>
                      <li @click="applyMyTicketsFilter('priority', 'medium')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">กลาง</li>
                      <li @click="applyMyTicketsFilter('priority', 'low')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">ต่ำ</li>
                    </ul>
                    <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-1">กรองตามสถานะ</div>
                    <ul class="pb-1 border-b border-gray-200">
                      <li @click="applyMyTicketsFilter('status', 'total')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        ทั้งหมด
                      </li>
                      <li @click="applyMyTicketsFilter('status', 'open')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        ใหม่
                      </li>
                      <li @click="applyMyTicketsFilter('status', 'in_progress')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        กำลังดำเนินการ
                      </li>
                      <li @click="applyMyTicketsFilter('status', 'closed')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        เสร็จสิ้น
                      </li>
                      <!-- เพิ่ม 'pending' ถ้าต้องการ -->
                      <!-- <li @click="applyMyTicketsFilter('status', 'pending')"
                      class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                    รอดำเนินการ
                  </li> -->
                    </ul>
                    <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-1">กรองตามแผนก</div>
                    <ul class="py-1 border-b border-gray-200">
                      <li @click="applyMyTicketsFilter('department', null)"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        ทั้งหมด (แผนก)
                      </li>
                      <li v-if="departmentsListMyTickets.length === 0 && !loadingDepartmentsMyTickets"
                        class="px-4 py-2 text-sm text-gray-400">ไม่มีข้อมูลแผนก</li>
                      <li v-if="loadingDepartmentsMyTickets" class="px-4 py-2 text-sm text-gray-400">กำลังโหลดแผนก...
                      </li>
                      <li v-for="dept in departmentsListMyTickets" :key="dept.id"
                        @click="applyMyTicketsFilter('department', dept.id)"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer uppercase">
                        {{ utilDepartmentName(dept.name) }}
                      </li>
                    </ul>
                    <!-- New Visibility Filter Section -->
                    <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-1">การแสดงผล</div>
                    <ul class="py-1">
                      <li @click="applyMyTicketsFilter('visibility', 'active')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        :class="{ 'bg-blue-100': visibilityFilterMyTickets === 'active' }">แสดงรายการปกติ</li>
                      <li @click="applyMyTicketsFilter('visibility', 'hidden')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        :class="{ 'bg-blue-100': visibilityFilterMyTickets === 'hidden' }">แสดงรายการที่จัดเก็บ</li>
                      <li @click="applyMyTicketsFilter('visibility', 'all')"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        :class="{ 'bg-blue-100': visibilityFilterMyTickets === 'all' }">แสดงทั้งหมด</li>
                    </ul>
                  </div>
                </div>

                <!-- Reset button -->
                <button @click="resetFilters"
                  class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white cursor-pointer hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
              <!-- Export Buttons -->
              <div v-if="!isSelectionModeActive" class="flex justify-start">
                <button @click="toggleSelectionMode"
                  class="h-10 px-4 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-600" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span class="hidden xs:inline">เลือกรายการ</span>
                  <span class="xs:hidden">เลือก</span>
                </button>
              </div>
              <div v-if="isSelectionModeActive" class="flex flex-wrap gap-2">
                <!-- Hide Selected button -->
                <button @click="hideSelectedTickets" :disabled="countSelected === 0"
                  class="h-10 px-3 sm:px-4 flex items-center justify-center border rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 text-xs sm:text-sm"
                  :class="countSelected > 0 ? 'bg-red-500 hover:bg-red-600 border-red-500 focus:ring-red-500' : 'bg-gray-400 border-gray-400 cursor-not-allowed'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M5 8h14M5 8a2 2 0 01-2-2V3a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2H5zM5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                  </svg>
                  จัดเก็บรายการที่เลือก ({{ countSelected }})
                </button>
                <button @click="exportSelectedToExcel" :disabled="countSelected === 0"
                  class="h-10 px-3 sm:px-4 flex items-center justify-center border rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 text-xs sm:text-sm"
                  :class="countSelected > 0 ? 'bg-green-500 hover:bg-green-600 border-green-500 focus:ring-green-500' : 'bg-gray-400 border-gray-400 cursor-not-allowed'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export ที่เลือก ({{ countSelected }})
                </button>
                <button @click="selectAllFilteredTickets" :disabled="filteredAndSearchedTickets.length === 0"
                  class="h-10 px-3 sm:px-4 flex items-center justify-center border border-blue-500 rounded-lg shadow-sm text-blue-500 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-xs sm:text-sm"
                  :class="filteredAndSearchedTickets.length === 0 ? 'opacity-50 cursor-not-allowed' : ''">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  เลือกทั้งหมด ({{ filteredAndSearchedTickets.length }})
                </button>
                <button @click="deselectAllTickets" :disabled="countSelected === 0"
                  class="h-10 px-3 sm:px-4 flex items-center justify-center border border-yellow-500 rounded-lg shadow-sm text-yellow-600 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 text-xs sm:text-sm"
                  :class="countSelected === 0 ? 'opacity-50 cursor-not-allowed' : ''">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  ยกเลิกเลือกทั้งหมด
                </button>
                <button @click="toggleSelectionMode"
                  class="h-10 px-3 sm:px-4 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-red-300 hover:bg-red-500 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 text-xs sm:text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>ยกเลิก</span>
                </button>
              </div>

              <div class="hidden sm:flex items-center space-x-2">
                <label for="perPageDesktopInput" class="text-sm text-gray-600 whitespace-nowrap">แสดง:</label>
                <input id="perPageDesktopInput" type="number" min="1" v-model.number="perPage"
                  class="w-16 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                <span class="text-sm text-gray-600 whitespace-nowrap">รายการต่อหน้า</span>
              </div>

            </div>
          </div>
        </div>

        <div class="mt-6 space-y-6 overflow-y-auto overflow-x-auto truncate">
          <div v-if="isLoading" class="text-center py-4 text-gray-600">กำลังโหลดข้อมูล...</div>
          <div v-else-if="!filteredAndSearchedTickets.length" class="text-center py-4 text-gray-500">
            ไม่พบใบงานแจ้งปัญหาตามเงื่อนไข หรือคุณยังไม่ได้สร้างใบงานใดๆ
          </div>
          <div v-else class="rounded-lg overflow-hidden overflow-x-auto border border-gray-200">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th v-if="isSelectionModeActive"
                    class="py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm w-10 text-center">
                    <input type="checkbox" @change="toggleSelectAllOnPage"
                      :checked="isAllSelectedOnCurrentPage && paginatedTickets.length > 0"
                      class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" />
                  </th>
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[80px]">
                    เลขอ้างอิง</th>
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[120px]">
                    หัวข้อ</th>
                  <th @click="toggleSortPriorityMyTickets"
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm hidden sm:table-cell min-w-[150px] cursor-pointer hover:bg-gray-200 transition-colors duration-150">
                    <div class="flex items-center">
                      <span>ความสำคัญ</span>
                      <svg v-if="sortPriorityMyTickets === 'asc'" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                      <svg v-if="sortPriorityMyTickets === 'desc'" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      <svg v-if="!sortPriorityMyTickets" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-400 opacity-50" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm hidden md:table-cell min-w-[100px]">
                    แผนก</th>
                  <th
                    class="text-center py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[150px]">
                    สถานะ</th>
                  <th @click="toggleSortDirection"
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-150 text-xs sm:text-sm min-w-[100px]">
                    <div class="flex items-center">
                      <span>วันที่สร้าง</span>
                      <svg v-if="sortDirection === 'asc'" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                      <svg v-if="sortDirection === 'desc'" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      <svg v-if="!sortDirection" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-400 opacity-50" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[120px]">
                    ชื่อผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ticket in paginatedTickets" :key="ticket.id"
                  class="text-sm border-gray-700/25 border-b align-top hover:bg-gray-50"
                  :class="{ 'cursor-pointer': !isSelectionModeActive, 'bg-blue-50 hover:bg-blue-100': isSelectionModeActive && selectedTicketIds.has(ticket.id) }"
                  @click="handleRowClick(ticket)">
                  <td v-if="isSelectionModeActive" class="py-3 px-4 text-center">
                    <input type="checkbox" :checked="selectedTicketIds.has(ticket.id)"
                      @click.stop="toggleTicketSelection(ticket.id)"
                      class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out cursor-pointer" />
                  </td>
                  <td class="py-3 px-4 text-gray-700">{{ ticket.reference_number }}</td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-gray-700 font-medium break-words">{{ ticket.title }}</td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-gray-600 hidden sm:table-cell break-words">
                    {{ utilpriorityName(ticket.priority) || "-"  }}
                  </td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-gray-700 hidden md:table-cell break-words"><span
                      class="uppercase">{{ utilDepartmentName(ticket.department?.name) || "-"
                      }}</span></td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-center">
                    <div>
                      <span :class="statusClass(ticket.status)" class="px-3 py-1 rounded-full text-sm ">
                        {{ utilStatusName(ticket.status) }}
                      </span>
                    </div>
                  </td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-gray-700 break-words">{{
                    formatDateDDMMYYYY(ticket.created_at) }}</td>
                  <td class="py-3 px-4 text-gray-700">{{ ticket.assignee?.name || "-" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination Controls -->
          <div v-if="totalPages > 1" class="mt-6 flex justify-between items-center">
            <button @click="prevPage" :disabled="currentPage === 1"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              ก่อนหน้า
            </button>
            <span class="text-sm text-gray-700">
              หน้า {{ currentPage }} จาก {{ totalPages }}
            </span>
            <button @click="nextPage" :disabled="currentPage === totalPages"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              ถัดไป
            </button>
          </div>
        </div>
      </cardcontent>
    </card>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue";
import cardtitle from '@/ui/cardtitle.vue';
import cardtitle2 from '@/ui/cardtitle2.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from 'vue-router';
import api from '@/api/axios-instance'; //Your configured axios instance
import { searchTickets, statusName as utilStatusName, formatDateDDMMYYYY as utilFormatDate, Ticket as UtilTicket, priorityName as utilpriorityName, departmentName as utilDepartmentName } from '@/utils/ticketUtils';
import Swal from 'sweetalert2'; // Import SweetAlert2
import * as XLSX from 'xlsx'; // Import the xlsx library
import { useTicketStore } from "@/stores/ticketStore"; // Import ticket store

const router = useRouter();
const auth = useAuthStore();
const ticketStore = useTicketStore(); // Import and use ticket store

interface User {
  id: number;
  name: string;
  email?: string;
}

interface Department {
  id?: number;
  name: string;
}

interface Assignee {
  name: string;
}

interface TicketCreatorInfo {
  id: number;
  name: string;
  email?: string;
}

interface Ticket extends UtilTicket { // สามารถ extends จาก UtilTicket ถ้าโครงสร้างส่วนใหญ่เหมือนกัน
  id: number;
  reference_number: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  contact: string;
  created_at: string;
  updated_at: string;
  department?: Department;
  assignee?: Assignee;
  user?: TicketCreatorInfo; // The user object (name, email) from API - ตรงกับ user ใน UtilTicket
  ticket_types?: { name: string; };
  // files?: Array<{ id: number; filename: string; filepath: string; }>; // Uncomment if needed
}

// const allFetchedTickets = ref<Ticket[]>([]); // No longer needed, will use ticketStore.tickets
const isLoading = ref(true);
const searchQuery = ref(''); // เพิ่ม ref สำหรับคำค้นหา
const perPage = ref(10);
const currentPage = ref(1);
const statusFilter = ref<'total' | 'open' | 'in_progress' | 'pending' | 'closed'>('total');
const sortPriorityMyTickets = ref<'asc' | 'desc' | null>(null); // Added this line
const priorityFilterMyTickets = ref<'high' | 'medium' | 'low' | null>(null);
const departmentFilterMyTickets = ref<number | null>(null);
const sortDirection = ref<'asc' | 'desc' | null>('desc'); // null: unsorted, 'asc': oldest first, 'desc': newest first
const visibilityFilterMyTickets = ref<'active' | 'hidden' | 'all'>('active'); // Added visibility filter ref

const isFilterDropdownOpenMyTickets = ref(false);
const filterDropdownMyTicketsRef = ref<HTMLElement | null>(null);

// --- State for selection ---
const selectedTicketIds = ref<Set<number>>(new Set());
const isSelectionModeActive = ref(false);

interface DepartmentListItem {
  id: number;
  name: string;
}
const departmentsListMyTickets = ref<DepartmentListItem[]>([]);
const loadingDepartmentsMyTickets = ref(false);
const officerCreatedTickets = computed(() => {
  if (!auth.user || typeof auth.user.id !== 'number') {
    // console.warn("OfficerMyTicketsPage: officerCreatedTickets - Auth user or ID invalid/missing.");
    return [];
  }
  const officerId = auth.user.id; 
  if (ticketStore.tickets.length === 0) { // Use ticketStore.tickets as the source
    return [];
  }

  // Filter tickets where the creator's ID matches the logged-in officer's ID
  const filtered = ticketStore.tickets.filter(ticket => { // Filter from ticketStore.tickets
    // Use ticket.user.id for filtering, as the API provides the user object with an ID.
    // Ensure ticket.user and ticket.user.id exist before comparing.
    const ticketCreatorId = ticket.user?.id;

    if (ticket.user === undefined || ticket.user.id === undefined) {
      console.warn(`OfficerMyTicketsPage: officerCreatedTickets - Ticket ID ${ticket.id} has undefined user or user.id. Skipping.`);
      return false;
    }
    // Ensure comparison is robust, e.g. if one is string and other is number
    return String(ticketCreatorId) === String(officerId);
  });
  return filtered;
});

const filteredAndSearchedTickets = computed(() => {
  let tickets = officerCreatedTickets.value;

  // Apply text search
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    tickets = searchTickets(tickets, searchQuery.value);
  }

  // Apply status filter
  if (statusFilter.value !== 'total') {
    tickets = tickets.filter(ticket => ticket.status === statusFilter.value);
  }

  if (priorityFilterMyTickets.value !== null) {
    tickets = tickets.filter(ticket => ticket.priority === priorityFilterMyTickets.value);
  }

  // Apply department filter
  if (departmentFilterMyTickets.value !== null) {
    tickets = tickets.filter(ticket => ticket.department?.id === departmentFilterMyTickets.value);
  }

  // Apply sorting
  const priorityOrderValue = { high: 3, medium: 2, low: 1 };
  let ticketsToSort = [...tickets]; // Create a copy to sort

  // Only sort if at least one sort criteria is active
  if (sortPriorityMyTickets.value || sortDirection.value) {
    ticketsToSort.sort((a, b) => {
      let comparison = 0;

      // 1. Primary Sort: Priority (if active)
      if (sortPriorityMyTickets.value) {
        const priorityA = priorityOrderValue[a.priority] || 0;
        const priorityB = priorityOrderValue[b.priority] || 0;
        const priorityComparison = sortPriorityMyTickets.value === 'asc' ? priorityA - priorityB : priorityB - priorityA;

        if (priorityComparison !== 0) {
          comparison = priorityComparison;
        }
      }

      // 2. Secondary Sort: Date (if active, or if it's the only active sort)
      if (comparison === 0 && sortDirection.value) {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();

        // Handle invalid dates - put them at the end
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return isNaN(dateB) ? 0 : 1; // Put NaN A after valid B
        if (isNaN(dateB)) return -1; // Put valid A before NaN B

        return sortDirection.value === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return comparison; // คืนค่า array ที่เรียงลำดับแล้ว (สำเนา)
    });
  }

  // ถ้าไม่ได้กำหนด sortDirection ให้คืนค่า tickets ที่ผ่านการกรองอื่นๆ มาแล้ว
  return ticketsToSort as Ticket[];
});

const totalPages = computed(() => {
  if (perPage.value <= 0) return 1; // Avoid division by zero or negative
  return Math.ceil(filteredAndSearchedTickets.value.length / perPage.value);
});

const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredAndSearchedTickets.value.slice(start, end);
});



const fetchOfficerTickets = async () => {
  // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Starting.");
  isLoading.value = true;
  if (!auth.accessToken) {
    isLoading.value = false;
    console.warn("OfficerMyTicketsPage: fetchOfficerTickets - No access token.");
    return;
  }
  // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Logged in Officer ID from auth store:", auth.user?.id, "Role:", auth.user?.role);

  try {
    // Call the store action to fetch tickets with the current visibility filter
    await ticketStore.fetchTickets({ visibility: visibilityFilterMyTickets.value });
    // officerCreatedTickets will now compute from ticketStore.tickets
  } catch (err) {
    console.error("OfficerMyTicketsPage: fetchOfficerTickets - Failed to load tickets.", err);
    //Consider adding user-facing error notification here
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // console.log("OfficerMyTicketsPage: onMounted - Component mounted.");
  const initFetch = () => {
    if (auth.user && typeof auth.user.id === 'number' && auth.user.role === 'OFFICER' || auth.user.role === 'USER') {
      // console.log("OfficerMyTicketsPage: initFetch - Conditions met, calling fetchOfficerTickets.", { userId: auth.user.id, role: auth.user.role });
      fetchOfficerTickets();
    } else {
      // console.warn("OfficerMyTicketsPage: initFetch - Conditions NOT met for fetching.");
    }
  };

  if (auth.user && typeof auth.user.id === 'number') {
    // console.log("OfficerMyTicketsPage: onMounted - Initial user data seems present, calling initFetch.");
    initFetch();
  } else {
    //Subscribe to auth store changes in case user info is loaded asynchronously
    const unsubscribe = auth.$subscribe((_mutation, state) => {
      if (state.user && typeof state.user.id === 'number' && state.user.role === 'OFFICER' || state.user.role === 'USER') { //Added role check here too for clarity
        initFetch();
        unsubscribe(); //Unsubscribe after successful fetch trigger
      }
    });
  }
  fetchDepartmentsListMyTickets();
  document.addEventListener('click', handleClickOutsideFilterDropdownMyTickets);
});

watch([searchQuery, perPage, statusFilter, priorityFilterMyTickets, departmentFilterMyTickets, sortDirection, sortPriorityMyTickets, visibilityFilterMyTickets], () => {
  currentPage.value = 1;
});

watch(currentPage, (newPage) => {
  if (newPage < 1) {
    currentPage.value = 1;
  } else if (newPage > totalPages.value && totalPages.value > 0) { //totalPages can be 0 if no tickets
    currentPage.value = totalPages.value;
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideFilterDropdownMyTickets);
});


const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const statusClass = (status: Ticket['status']): object => ({
  'bg-red-100 text-red-700': status === 'open',
  'bg-yellow-100 text-yellow-700': status === 'in_progress',
  'bg-purple-100 text-purple-700': status === 'pending',
  'bg-green-100 text-green-700': status === 'closed',
});

const formatDateDDMMYYYY = (dateString: string | Date): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const goToTicket = (id: number) => {
  router.push(`/tickets/${id}`);
};

const fetchDepartmentsListMyTickets = async () => {
  loadingDepartmentsMyTickets.value = true;
  try {
    const res = await api.get(`/departments`);
    departmentsListMyTickets.value = res.data as DepartmentListItem[];
  } catch (error) {
    console.error('MyTicketsPage: Failed to fetch departments list:', error);
  } finally {
    loadingDepartmentsMyTickets.value = false;
  }
};

const toggleFilterDropdownMyTickets = () => {
  isFilterDropdownOpenMyTickets.value = !isFilterDropdownOpenMyTickets.value;
};

const applyMyTicketsFilter = (filterType: 'status' | 'department' | 'priority' | 'visibility', value: 'total' | 'open' | 'in_progress' | 'pending' | 'closed' | number | null | 'high' | 'medium' | 'low' | 'active' | 'hidden' | 'all') => {

  if (filterType === 'status') {
    statusFilter.value = value as 'total' | 'open' | 'in_progress' | 'pending' | 'closed';
    // Clear department filter when a status is selected from this dropdown
    if (value !== 'total') { // or some other indicator that a specific status was chosen
      departmentFilterMyTickets.value = null;
      priorityFilterMyTickets.value = null;
    }
  } else if (filterType === 'priority') {
    priorityFilterMyTickets.value = value as 'high' | 'medium' | 'low' | null;
    // Clear status filter when a priority is selected from this dropdown
    if (value !== null) {
      statusFilter.value = 'total'; // Reset status filter to 'all'
      departmentFilterMyTickets.value = null;
    }
  } else if (filterType === 'visibility') {
    visibilityFilterMyTickets.value = value as 'active' | 'hidden' | 'all';
    fetchOfficerTickets(); // Re-fetch tickets from backend with new visibility
  } else if (filterType === 'department') {
    departmentFilterMyTickets.value = value as number | null;
    // Clear status filter when a department is selected from this dropdown
    if (value !== null) {
      statusFilter.value = 'total'; // Reset status filter to 'all'
    }
  }
  isFilterDropdownOpenMyTickets.value = false;
};

const handleClickOutsideFilterDropdownMyTickets = (event: MouseEvent) => {
  if (filterDropdownMyTicketsRef.value && !filterDropdownMyTicketsRef.value.contains(event.target as Node)) {
    isFilterDropdownOpenMyTickets.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = '' // ล้างการค้นหา
  statusFilter.value = 'total' // กลับไปแสดงทั้งหมด
  priorityFilterMyTickets.value = null; // ล้าง filter ความสำคัญ
  departmentFilterMyTickets.value = null; // ล้าง filter แผนก
   visibilityFilterMyTickets.value = 'active'; // รีเซ็ต filter การมองเห็นเป็น 'active'
  perPage.value = 10 // รีเซ็ตเป็นค่าเริ่มต้น

  // ถ้ามีตัวกรองอื่นๆ สามารถเพิ่มได้ที่นี่
  // dateFilter.value = null
  // categoryFilter.value = 'all'
}

const toggleSortDirection = () => {
  if (sortDirection.value === null) {
    sortDirection.value = 'desc'; // Default to newest first
  } else if (sortDirection.value === 'desc') {
    sortDirection.value = 'asc'; // Then oldest first
  } else {
    sortDirection.value = null; // Then unsorted (or back to default API order)
  }
  // Keep priority sort state
};

const toggleSortPriorityMyTickets = () => {
  if (sortPriorityMyTickets.value === null) {
    sortPriorityMyTickets.value = 'desc'; // Default to High to Low
  } else if (sortPriorityMyTickets.value === 'desc') {
    sortPriorityMyTickets.value = 'asc'; // Low to High
  } else {
    sortPriorityMyTickets.value = null;
  }
  // Keep date sort state
};

const statusName = (status: string) => {
  switch (status) {
    case "open":
      return "รอดำเนินการ";
    case "in_progress":
      return "กำลังดำเนินการ";
    case "pending":
      return "รอดำเนินการ";
    case "closed":
      return "เสร็จสิ้น";
    default:
      return status;
  }
};

const toggleSelectionMode = () => {
  isSelectionModeActive.value = !isSelectionModeActive.value;
  if (!isSelectionModeActive.value) {
    selectedTicketIds.value.clear(); // Clear selection when exiting mode
  }
};

const toggleTicketSelection = (ticketId: number) => {
  if (selectedTicketIds.value.has(ticketId)) {
    selectedTicketIds.value.delete(ticketId);
  } else {
    selectedTicketIds.value.add(ticketId);
  }
};

const toggleSelectAllOnPage = (event: Event) => {
  const target = event.target as HTMLInputElement;
  paginatedTickets.value.forEach(ticket => {
    if (target.checked) {
      selectedTicketIds.value.add(ticket.id);
    } else {
      selectedTicketIds.value.delete(ticket.id);
    }
  });
};

const isAllSelectedOnCurrentPage = computed(() => {
  if (paginatedTickets.value.length === 0) return false;
  return paginatedTickets.value.every(ticket => selectedTicketIds.value.has(ticket.id));
});

const countSelected = computed(() => selectedTicketIds.value.size);

const handleRowClick = (ticket: Ticket) => { // Changed type from 'ticket' to 'Ticket'
  if (isSelectionModeActive.value) {
    toggleTicketSelection(ticket.id);
  } else {
    goToTicket(ticket.id);
  }
};

const selectAllFilteredTickets = () => {
  filteredAndSearchedTickets.value.forEach(ticket => { // Use filteredAndSearchedTickets
    selectedTicketIds.value.add(ticket.id);
  });
};

const deselectAllTickets = () => {
  selectedTicketIds.value.clear();
};

const hideSelectedTickets = async () => {
  if (countSelected.value === 0) {
    Swal.fire({
      icon: 'info',
      title: 'ไม่ได้เลือกรายการ',
      text: 'กรุณาเลือกอย่างน้อยหนึ่งรายการเพื่อจัดเก็บ',
    });
    return;
  }

  const confirmResult = await Swal.fire({
    title: 'ยืนยันการจัดเก็บรายการ?',
    text: `คุณต้องการจัดเก็บ Ticket ที่เลือกจำนวน ${countSelected.value} รายการใช่หรือไม่? รายการที่จัดเก็บจะไม่แสดงในรายการนี้`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ใช่, จัดเก็บเลย!',
    cancelButtonText: 'ยกเลิก'
  });

  if (!confirmResult.isConfirmed) {
    return;
  }

  try {
    const ticketIdsToHide = Array.from(selectedTicketIds.value);
    await api.patch('/tickets/visibility', { ticketIds: ticketIdsToHide, isHidden: true });

    Swal.fire('จัดเก็บสำเร็จ!', 'รายการที่เลือกถูกจัดเก็บเรียบร้อยแล้ว', 'success');
    selectedTicketIds.value.clear();
    isSelectionModeActive.value = false;
    await fetchOfficerTickets(); // Refresh the list specific to this page
  } catch (error) {
    console.error('Error hiding tickets:', error);
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถจัดเก็บรายการที่เลือกได้', 'error');
  }
};

const exportToExcel = async () => {
  if (!filteredAndSearchedTickets.value || filteredAndSearchedTickets.value.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'ไม่มีข้อมูล',
      text: 'ไม่พบข้อมูลตั๋วตามเงื่อนไขปัจจุบันสำหรับ Export',
    });
    return;
  }

  // If not in selection mode, enter it.
  if (!isSelectionModeActive.value) {
    toggleSelectionMode();
    return;
  }

  // If in selection mode, but nothing selected, show message.
  if (isSelectionModeActive.value && countSelected.value === 0) {
    Swal.fire({
      icon: 'info',
      title: 'ไม่ได้เลือกรายการ',
      text: 'กรุณาเลือกอย่างน้อยหนึ่งรายการเพื่อ Export',
    });
    return;
  }

  // If in selection mode and items are selected, proceed to export.
  await exportSelectedToExcel();
};

const exportSelectedToExcel = async () => {
  if (countSelected.value === 0) {
    return;
  }

  Swal.fire({
    title: 'กำลัง Export ข้อมูล...',
    text: `กำลังสร้างไฟล์ Excel สำหรับ ${countSelected.value} รายการที่เลือก...`,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
  setTimeout(() => {
    try {
      const ticketsToExport = filteredAndSearchedTickets.value.filter(
        (ticket) => selectedTicketIds.value.has(ticket.id)
      );

      if (ticketsToExport.length === 0) {
        Swal.close();
        Swal.fire('ไม่พบรายการ', 'ไม่พบรายการที่เลือกสำหรับ Export', 'info');
        return;
      }

      const dataToExport = ticketsToExport.map(ticket => ({
        'เลขอ้างอิง': ticket.reference_number,
        'หัวข้อ': ticket.title,
        'รายละเอียด': ticket.description,
        'แผนก': utilDepartmentName(ticket.department?.name) || "-",
        'หมวดหมู่': ticket.ticket_types?.name || "-",
        'ความสำคัญ': utilpriorityName(ticket.priority) || "-",
        'สถานะ': statusName(ticket.status),
        'ผู้แจ้ง': ticket.user?.name || "-",
        'ติดต่อ': ticket.contact || "-",
        'วันที่สร้าง': formatDateDDMMYYYY(ticket.created_at),
        'ผู้รับผิดชอบ': ticket.assignee?.name || "-",
        'หมายเหตุ': ticket.comment || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "รายการแจ้งปัญหาของฉันที่เลือก");

      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const fileName = `my_selected_tickets_export_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fileName);
      Swal.close(); // Close loading
      Swal.fire({
        icon: 'success',
        title: 'Export สำเร็จ!',
        text: `ไฟล์ ${fileName} (จำนวน ${ticketsToExport.length} รายการ) ได้ถูกดาวน์โหลดเรียบร้อยแล้ว`,
      });
      selectedTicketIds.value.clear();
      isSelectionModeActive.value = false;
    } catch (error) {
      Swal.close(); // Close loading
      Swal.fire({
        icon: 'error',
        title: 'Export ไม่สำเร็จ',
        text: 'เกิดข้อผิดพลาดขณะสร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง',
      });
      console.error("Error exporting to Excel:", error);
    }
  }, 3000); // Delay for UI update
};
</script>

<style scoped>
/* Add any specific styles if needed */
.max-w-xs {
  max-width: 20rem;
  /* Adjust as needed for description column width */
}
</style>