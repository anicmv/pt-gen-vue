<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input/Input.vue'
import Textarea from '@/components/ui/textarea/Textarea.vue'

interface SearchResult {
  year: string
  type: string
  title: string
  subtitle: string
  link: string
  id: string
}

interface ApiResponse {
  success: boolean
  error?: string
  format?: string
  data?: SearchResult[]
}

const inputValue = ref('')
const showSearchSource = ref(false)
const isQuerying = ref(false)
const output = ref('')
const showGenHelp = ref(false)
const showGenOut = ref(true)
const searchResults = ref<SearchResult[]>([])

watch(inputValue, (newValue) => {
  if (/^http/.test(newValue) || newValue === '') {
    showSearchSource.value = false
  } else {
    showSearchSource.value = true
  }
})

const handleCopyClick = async () => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(output.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = output.value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    alert('已复制到剪贴板！')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制。')
  }
}

const handleSubmit = async () => {
  isQuerying.value = true

  try {
    if (inputValue.value.length === 0) {
      alert('空字符，请检查输入')
      isQuerying.value = false
      return
    }

    if (/^http/.test(inputValue.value)) {
      showGenHelp.value = false
      showGenOut.value = true

      const params = new URLSearchParams({
        url: inputValue.value
      })

      const response = await fetch(`/api/gen?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        alert('Error occurred!')
        isQuerying.value = false
        return
      }

      const data: ApiResponse = await response.json()

      if (!data.success && data.error) {
        output.value = data.error
      } else {
        output.value = data.format || ''
      }
    } else {
      showGenHelp.value = true
      showGenOut.value = false
      output.value = ''

      const params = new URLSearchParams({
        search: inputValue.value,
        // source: 'douban'
        source: 'doubanMobile'
      })

      const response = await fetch(`/api/gen?${params.toString()}`)

      if (!response.ok) {
        alert('Error occurred!')
        isQuerying.value = false
        return
      }

      const data: ApiResponse = await response.json()
      if (!data.success) {
        alert(data.error)
      } else if (data.data && Array.isArray(data.data)) {
        searchResults.value = data.data
      }
    }
  } catch (error) {
    console.error('Error:', error)
    alert('An error occurred while processing your request.')
  } finally {
    isQuerying.value = false
  }
}

const handleResultClick = async (url: string) => {
  inputValue.value = url
  showSearchSource.value = false
  searchResults.value = []
  showGenHelp.value = false
  showGenOut.value = true
  await handleSubmit()
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <nav class="bg-[#222] text-white h-[50px] flex items-center justify-center px-4">
      <span class="text-lg font-bold">PT Gen</span>
    </nav>

    <!-- Main Content -->
    <div class="flex-1 bg-gray-50 py-8 px-4">
      <div class="max-w-3xl mx-auto">
        <!-- Search Input -->
        <div class="flex gap-2 mb-6">
          <Input
            v-model="inputValue"
            placeholder="名称或豆瓣资源链接"
            class="flex-1"
            @keyup.enter="handleSubmit"
          />
          <Button
            @click="handleSubmit"
            :disabled="isQuerying"
            class="bg-green-500 hover:bg-green-600 text-white min-w-[80px]"
          >
            {{ isQuerying ? '查询中' : showSearchSource ? '搜索' : '查询' }}
          </Button>
        </div>

        <hr class="border-gray-300 mb-6" />

        <!-- 结果区域 - 动态高度 -->
        <div class="mb-6">
          <!-- Search Results Table -->
          <div v-if="showGenHelp && searchResults.length > 0" class="mb-6">
            <div class="bg-white rounded border border-gray-300 overflow-hidden">
              <table class="w-full">
                <thead>
                <tr class="bg-gray-100 border-b border-gray-300">
                  <th class="px-4 py-2 text-left font-medium text-gray-700">年代</th>
                  <th class="px-4 py-2 text-left font-medium text-gray-700">类别</th>
                  <th class="px-4 py-2 text-left font-medium text-gray-700">标题</th>
                  <th class="px-4 py-2 text-left font-medium text-gray-700">资源链接</th>
                  <th class="px-4 py-2 text-left font-medium text-gray-700">行为</th>
                </tr>
                </thead>
                <tbody>
                <tr
                  v-for="(item, index) in searchResults"
                  :key="index"
                  :class="index % 2 === 0 ? 'bg-gray-50' : 'bg-white'"
                  class="border-b border-gray-200 last:border-b-0"
                >
                  <td class="px-4 py-2">{{ item.year }}</td>
                  <td class="px-4 py-2">{{ item.type }}</td>
                  <td class="px-4 py-2">
                    {{ item.title }}
                    <br v-if="item.subtitle && item.subtitle !== item.title" />
                    <span v-if="item.subtitle !== item.title" class="text-gray-600">
                        {{ item.subtitle }}
                      </span>
                  </td>
                  <td class="px-4 py-2">
                    <a
                      :href="item.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:underline"
                    >
                      {{ item.link }}
                    </a>
                  </td>
                  <td class="px-4 py-2">
                    <Button
                      variant="link"
                      size="sm"
                      @click="handleResultClick(item.link)"
                      class="text-blue-600 p-0 h-auto"
                    >
                      选择
                    </Button>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Output Textarea -->
          <div v-if="showGenOut" class="relative min-h-[550px]">
            <Button
              variant="outline"
              size="sm"
              @click="handleCopyClick"
              class="absolute top-2 right-2 z-10 bg-white"
            >
              复制
            </Button>
            <Textarea
              v-model="output"
              readonly
              :rows="22"
              class="w-full font-mono text-sm"
              placeholder="查询结果将显示在这里..."
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <nav class="bg-[#222] text-white h-[50px] flex items-center justify-end px-4 gap-4"></nav>
  </div>
</template>
